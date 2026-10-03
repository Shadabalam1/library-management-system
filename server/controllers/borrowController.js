import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Book } from "../models/bookModel.js";
import { Borrow } from "../models/borrowModel.js";
import { User } from "../models/userModel.js";
import { calculateFine } from "../utils/fineCalculator.js";
import { BorrowRequest } from "../models/borrowRequestModel.js";
import mongoose from 'mongoose';

export const recordBorrowedBook = catchAsyncErrors(async(req, res, next)=>{
    const { id } = req.params;
    const { email } = req.body;

    const book = await Book.findById(id);
    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    const user = await User.findOne({ email, accountVerified: true });
    if (!user) {
        return next(new ErrorHandler("User not found.", 404));
    }

    if (book.quantity === 0) {
        return next(new ErrorHandler("Book not available.", 404));
    }

    const isAlreadyBorrowed = user.borrowedBooks.find(
        (b) => b.bookId.toString() === id && b.returned === false
    );

    if (isAlreadyBorrowed) {
        return next(new ErrorHandler("Book already borrowed.", 400));
    }

    book.quantity -= 1;
    book.availability = book.quantity > 0;
    await book.save();

    user.borrowedBooks.push({
        bookId: book._id,
        bookTitle: book.title,
        borrowedDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    await Borrow.create({
        user:{
            id: user._id,
            name: user.name,
            email: user.email
        },
        book: book._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        price: book.price,
        borrowDate: new Date(),   
    });

    res.status(200).json({
        success: true,
        message: "Borrowed book recorded successfully.",
    });
});

export const returnBorrowedBook = catchAsyncErrors(async(req, res, next)=>{
    const {bookId} = req.params;
    const user = req.user;
    const book = await Book.findById(bookId);
    if (!book) return next(new ErrorHandler("Book not found.", 404));

    const borrowedBook = user.borrowedBooks.find(
        (entry) => entry.bookId.toString() === bookId && entry.returned === false
    );
    if (!borrowedBook) {
        return next(new ErrorHandler("You have not borrowed this book.", 400));
    }

    const borrow = await Borrow.findOne({
        book: bookId,
        "user.id": user._id,
        returnDate: null,
    });
    if (!borrow) return next(new ErrorHandler("Borrow record not found.", 404));

    const existingRequest = await BorrowRequest.findOne({
        requestType: "return",
        borrow: borrow._id,
        status: "pending",
    });
    if (existingRequest) {
        return next(new ErrorHandler("A return request is already pending.", 400));
    }

    const fine = calculateFine(borrow.dueDate);
    const returnRequest = await BorrowRequest.create({
        requestType: "return",
        borrow: borrow._id,
        user: { id: user._id, name: user.name, email: user.email },
        book: { id: book._id, title: book.title, author: book.author },
        requestDate: new Date(),
        returnRequestedDate: new Date(),
        fine,
        totalPrice: book.price + fine,
    });

    res.status(200).json({
        success: true,
        message: "Return request sent to admin.",
        returnRequest,
        fine,
    });
});

export const borrowedBooks = catchAsyncErrors(async(req, res, next)=>{
    const borrowedBooks = req.user.borrowedBooks;
    res.status(200).json({
        success: true,
        borrowedBooks,
    });
});

export const getBorrowedBookForAdmin = catchAsyncErrors(async(req, res, next)=>{
    try {
        const borrowedBooks = await Borrow.find({ returnDate: null })
            .populate({
                path: 'user.id',
                select: 'name email'
            })
            .populate({
                path: 'book',
                select: 'title author'
            })
            .sort({ borrowDate: -1 });

        // Format the data for better readability
        const formattedBorrowedBooks = borrowedBooks.map(borrow => ({
            id: borrow._id,
            userName: borrow.user?.name || "Unknown User",
            userEmail: borrow.user?.email || "No email",
            bookTitle: borrow.book?.title || "Unknown Book",
            bookAuthor: borrow.book?.author || "Unknown Author",
            borrowDate: borrow.borrowDate,
            dueDate: borrow.dueDate,
            price: borrow.price,
            fine: borrow.fine || 0,
            status: borrow.returnDate ? "returned" : "approved",
            isOverdue: new Date() > new Date(borrow.dueDate)
        }));

        res.status(200).json({
            success: true,
            borrowedBooks: formattedBorrowedBooks,
            totalBorrowed: formattedBorrowedBooks.length
        });
    } catch (error) {
        next(error);
    }
});

export const requestBorrowBook = catchAsyncErrors(async(req, res, next)=>{
    const { id } = req.params;
    const userId = req.user._id;
    const user = req.user;

    const book = await Book.findById(id);
    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    if (book.quantity === 0) {
        return next(new ErrorHandler("Book not available.", 400));
    }

    const existingRequest = await BorrowRequest.findOne({
        "user.id": userId,
        "book.id": id,
        status: "pending"
    });

    if (existingRequest) {
        return next(new ErrorHandler("You have already requested this book.", 400));
    }

    const borrowRequest = await BorrowRequest.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        book: {
            id: book._id,
            title: book.title,
            author: book.author
        }
    });

    res.status(201).json({
        success: true,
        message: "Borrow request sent successfully. Waiting for admin approval.",
        borrowRequest
    });
});

export const approveBorrowRequest = catchAsyncErrors(async(req, res, next)=>{
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
        return next(new ErrorHandler("Borrow request not found.", 404));
    }

    if (request.status !== "pending") {
        return next(new ErrorHandler("Request already processed.", 400));
    }

    const book = await Book.findById(request.book.id);
    if (!book || book.quantity === 0) {
        return next(new ErrorHandler("Book no longer available.", 400));
    }

    // Update book
    book.quantity -= 1;
    book.availability = book.quantity > 0;
    await book.save();

    // Update user
    const user = await User.findById(request.user.id);
    if (user) {
        user.borrowedBooks.push({
            bookId: book._id,
            bookTitle: book.title,
            borrowedDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await user.save();
    }

    // Update request
    request.status = "approved";
    request.approvedDate = new Date();
    await request.save();

    // Create borrow record
    await Borrow.create({
        user: {
            id: request.user.id,
            name: request.user.name,
            email: request.user.email
        },
        book: book._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        price: book.price,
        borrowDate: new Date(),   
    });

    res.status(200).json({
        success: true,
        message: "Borrow request approved successfully. Book borrowed.",
        request
    });
});

export const rejectBorrowRequest = catchAsyncErrors(async(req, res, next)=>{
    const { requestId } = req.params;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
        return next(new ErrorHandler("Borrow request not found.", 404));
    }

    if (request.status !== "pending") {
        return next(new ErrorHandler("Request already processed.", 400));
    }

    request.status = "rejected";
    request.rejectedDate = new Date();
    await request.save();

    res.status(200).json({
        success: true,
        message: "Borrow request rejected.",
        request
    });
});

export const getUserBorrowRequests = catchAsyncErrors(async(req, res, next)=>{
    const userId = req.user._id;
    
    const requests = await BorrowRequest.find({"user.id": userId})
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        requests
    });
});

export const getPendingBorrowRequests = catchAsyncErrors(async(req, res, next)=>{
    try {
        const requests = await BorrowRequest.find({
            status: "pending",
            requestType: { $ne: "return" },
        })
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        next(error);
    }
});

export const requestReturnBook = catchAsyncErrors(async(req, res, next)=>{
    const { bookId } = req.params;
    const userId = req.user._id;

    return returnBorrowedBook(req, res, next);
});

export const getPendingReturnRequests = catchAsyncErrors(async (req, res) => {
    const requests = await BorrowRequest.find({ requestType: "return", status: "pending" })
        .populate("borrow", "borrowDate dueDate")
        .sort({ requestDate: -1 });
    res.status(200).json({ success: true, requests });
});

export const approveReturnRequest = catchAsyncErrors(async (req, res, next) => {
    const request = await BorrowRequest.findOne({
        _id: req.params.requestId,
        requestType: "return",
        status: "pending",
    });
    if (!request) return next(new ErrorHandler("Pending return request not found.", 404));

    const borrow = await Borrow.findById(request.borrow);
    if (!borrow || borrow.returnDate) {
        return next(new ErrorHandler("Borrow record is already returned or missing.", 400));
    }

    const book = await Book.findById(request.book.id);
    if (!book) return next(new ErrorHandler("Book not found.", 404));

    const user = await User.findById(request.user.id);
    const userBorrow = user?.borrowedBooks.find(
        (entry) => entry.bookId.toString() === request.book.id.toString() && !entry.returned
    );
    if (!user || !userBorrow) {
        return next(new ErrorHandler("Active user borrowing record not found.", 400));
    }

    const returnDate = new Date();
    borrow.returnDate = returnDate;
    borrow.fine = calculateFine(borrow.dueDate);
    borrow.status = "returned";
    await borrow.save();

    userBorrow.returned = true;
    userBorrow.returnedDate = returnDate;
    await user.save();

    book.quantity += 1;
    book.availability = book.quantity > 0;
    await book.save();

    request.status = "approved";
    request.approvedDate = returnDate;
    request.processedDate = returnDate;
    request.processedBy = req.user._id;
    await request.save();

    res.status(200).json({ success: true, message: "Return approved successfully.", request });
});

export const rejectReturnRequest = catchAsyncErrors(async (req, res, next) => {
    const request = await BorrowRequest.findOne({
        _id: req.params.requestId,
        requestType: "return",
        status: "pending",
    });
    if (!request) return next(new ErrorHandler("Pending return request not found.", 404));

    const processedDate = new Date();
    request.status = "rejected";
    request.rejectedDate = processedDate;
    request.processedDate = processedDate;
    request.processedBy = req.user._id;
    await request.save();

    res.status(200).json({ success: true, message: "Return request rejected.", request });
});

export const renewBorrowedBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const borrowedBook = await Borrow.findOne({
            book: bookId,
            "user.id": userId,
            returnDate: null
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

export const returnBook = catchAsyncErrors(async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    
    if (!borrow) {
      return next(new ErrorHandler("Borrow record not found", 404));
    }
    
    if (borrow.status === "returned") {
      return next(new ErrorHandler("Book already returned", 400));
    }
    
    // Update borrow status
    borrow.status = "returned";
    borrow.returnDate = Date.now();
    await borrow.save();
    
    // Update book quantity
    const book = await Book.findById(borrow.book);
    if (book) {
      book.quantity += 1;
      book.availability = book.quantity > 0;
      await book.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Book returned successfully"
    });
    
  } catch (error) {
    return next(new ErrorHandler("Failed to return book", 500));
  }
});


export const getUserBorrowHistory = catchAsyncErrors(async(req, res, next)=>{
    try {
        const { userId } = req.params;
        
        // Get user's borrowed books history
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Get all borrow records for this user
        const borrowHistory = await Borrow.find({ "user.id": userId })
            .populate({
                path: 'book',
                select: 'title author'
            })
            .sort({ borrowDate: -1 });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            borrowHistory: borrowHistory,
            totalBorrowed: borrowHistory.length
        });
    } catch (error) {
        next(error);
    }
});