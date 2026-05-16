import express from "express";
import { deleteUser } from "../controllers/authController.js";

import {
    getAllUsers,
    registerNewAdmin,
} from "../controllers/userController.js"


import {
    isAuthenticated,
    isAuthorized
} from "../middlewares/authMiddleware.js"

const router = express.Router();



router.get("/all", isAuthenticated, isAuthorized("Admin"), getAllUsers)
router.post("/add/new-admin", isAuthenticated, isAuthorized("Admin"), registerNewAdmin);
//router.delete("/user/:id", isAuthenticated, isAuthorized("Admin"), deleteUser);
router.delete("/:id", isAuthenticated, isAuthorized("Admin"), deleteUser);


export default router;












