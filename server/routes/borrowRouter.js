import express from "express";

import {
    borrowedBooks,
    getBorrowedBookForAdmin,
    recordBorrowedBook,
    returnBorrowedBook,
    requestBorrowBook,

     getUserBorrowHistory,
    approveBorrowRequest,
    rejectBorrowRequest,
    getUserBorrowRequests,
    getPendingBorrowRequests,
    returnBook,
    renewBorrowedBook
} from "../controllers/borrowController.js"

import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/record-borrow-book/:id", isAuthenticated, isAuthorized("Admin"), recordBorrowedBook);
router.get("/borrowed-books-by-users", isAuthenticated, isAuthorized("Admin"), getBorrowedBookForAdmin);
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks );
router.put("/return-borrowed-book/:bookId", isAuthenticated, returnBorrowedBook);





// Borrow Router me ye route add karein
router.get("/user/:userId/history", isAuthenticated, isAuthorized("Admin"), getUserBorrowHistory);
router.post("/request/:id", isAuthenticated, requestBorrowBook);           
router.put("/approve/:requestId", isAuthenticated, isAuthorized("Admin"), approveBorrowRequest);  
router.put("/reject/:requestId", isAuthenticated, isAuthorized("Admin"), rejectBorrowRequest);    
router.get("/my-requests", isAuthenticated, getUserBorrowRequests);       
router.get("/pending-requests", isAuthenticated, isAuthorized("Admin"), getPendingBorrowRequests); 
router.get("/all-records", isAuthenticated, isAuthorized("Admin"), getBorrowedBookForAdmin);
router.post("/renew/:bookId", isAuthenticated, renewBorrowedBook);

export default router;