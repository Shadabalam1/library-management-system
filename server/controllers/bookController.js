import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

import {Book} from "../models/bookModel.js"
import ErrorHandler from "../middlewares/errorMiddleware.js"



export const addBook = catchAsyncErrors(async (req, res, next)=>{
    
    const { title, author, description, price, quantity } = req.body;
        if (!title || !author || !description || price === undefined || quantity === undefined) {
        return next(new ErrorHandler("please fill all fields.", 400))
    }


    const book = await Book.create({ title, author, description, price, quantity});
    res.status(201).json({
        success : true,
        message : "Book added successfully",
        book,
    });

});


export const getAllBook = catchAsyncErrors(async (req, res, next)=>{

    const books = await Book.find();
    res.status(200).json({
        success: true,
        books,
    })
})



export const deleteBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid Book ID.", 400));
    }

    const book = await Book.findByIdAndDelete(id);

    // ✅ If no book found
    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Book deleted successfully.",
    });
});


export const renewBorrowedBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const borrowedBook = await Borrow.findOne({
      bookId: bookId,
      userId: userId,
      returned: false
    });

    if (!borrowedBook) {
      return res.status(404).json({
        success: false,
        message: "Borrowed book not found or already returned"
      });
    }

    if (borrowedBook.renewed) {
      return res.status(400).json({
        success: false,
        message: "Book already renewed once"
      });
    }

    const currentDate = new Date();
    if (currentDate > new Date(borrowedBook.dueDate)) {
      return res.status(400).json({
        success: false,
        message: "Cannot renew overdue books. Please return the book first."
      });
    }

    const newDueDate = new Date(borrowedBook.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);

    // Update the borrowed book record
    borrowedBook.dueDate = newDueDate;
    borrowedBook.renewed = true;
    borrowedBook.renewedDate = currentDate;
    borrowedBook.renewalCount = (borrowedBook.renewalCount || 0) + 1;

    await borrowedBook.save();

    res.status(200).json({
      success: true,
      message: "Book renewed successfully for 14 more days",
      borrowedBook
    });

  } catch (error) {
    console.error("Renew book error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// LAST ME YE ADD KAREIN:

export const returnBook = catchAsyncErrors(async (req, res, next) => {
  try {
    // Find the borrow record
    const borrow = await Borrow.findById(req.params.id)
      .populate("user", "name email")
      .populate("book", "title author quantity");

    if (!borrow) {
      return next(new ErrorHandler("Borrow record not found", 404));
    }

    // Check if book is already returned
    if (borrow.status === "returned") {
      return next(new ErrorHandler("Book already returned", 400));
    }

    // Check if book is approved (can only return approved books)
    if (borrow.status !== "approved") {
      return next(new ErrorHandler("Cannot return book that is not approved", 400));
    }

    // Update borrow status
    borrow.status = "returned";
    borrow.returnDate = Date.now();
    await borrow.save();

    // Update book quantity (increase by 1)
    const book = await Book.findById(borrow.book);
    if (book) {
      book.quantity += 1;
      book.availability = book.quantity > 0;
      await book.save();
    }

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      borrow
    });

  } catch (error) {
    return next(new ErrorHandler("Failed to return book", 500));
  }
});






export const getSingleBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Book ID.", 400));
  }

  const book = await Book.findById(id);

  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  res.status(200).json({
    success: true,
    book,
  });
});


export const updateBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Book ID.", 400));
  }

  const { title, author, description, price, quantity } = req.body;

  const book = await Book.findById(id);

  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  book.title = title || book.title;
  book.author = author || book.author;
  book.description = description || book.description;
  book.price = price ?? book.price;
  book.quantity = quantity ?? book.quantity;

  // availability auto update
  book.availability = book.quantity > 0;

  await book.save();

  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    book,
  });
});