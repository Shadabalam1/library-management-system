// import mongoose from "mongoose";
// import { isAuthenticated, isAuthorized} from "../middlewares/authMiddleware.js"

// import { addBook, deleteBook, getAllBook } from "../controllers/bookController.js"
// import express from "express"

// const router = express.Router();


// router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
// router.get("/all", isAuthenticated, getAllBook )
// router.delete(
//     "/delete/:id",
// isAuthenticated, 
//      isAuthorized("Admin"),
//       deleteBook
// )


// export default router;


import mongoose from "mongoose";
import express from "express";

import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

import {
  addBook,
  deleteBook,
  getAllBook,
  getSingleBook,
  updateBook,
} from "../controllers/bookController.js";

const router = express.Router();

// Add book
router.post(
  "/admin/add",
  isAuthenticated,
  isAuthorized("Admin"),
  addBook
);

// Get all books
router.get("/all", isAuthenticated, getAllBook);

// ✅ Get single book
router.get(
  "/:id",
  isAuthenticated,
  getSingleBook
);

// ✅ Update book
router.put(
  "/:id",
  isAuthenticated,
  isAuthorized("Admin"),
  updateBook
);

// Delete book
router.delete(
  "/delete/:id",
  isAuthenticated,
  isAuthorized("Admin"),
  deleteBook
);

export default router;