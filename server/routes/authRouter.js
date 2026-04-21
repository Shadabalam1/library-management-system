import express from "express"
import {
  forgotPassword, 
  getUser, 
  login, 
  adminLogin,
  registerAdmin,
  logout, 
  register, 
  updatePassword, 
  verifyOTP,
  uploadProfilePic 
} from "../controllers/authController.js"
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/logout", isAuthenticated ,logout);
router.get("/me", isAuthenticated , getUser);
router.post("/password/forgot", forgotPassword);

//router.get("/password/reset/:token", getResetPasswordToken); 
router.put("/password/reset/:token", resetPassword);    


//router.put("/password/reset/:token", resetPassword);
router.put("/password/update",  isAuthenticated, updatePassword);
router.post("/upload-profile-pic", isAuthenticated, uploadProfilePic); // ✅ Add this new route
router.post("/admin/login", adminLogin);
router.put("/update-password", isAuthenticated, updatePassword);
router.post("/admin/register", isAuthenticated, isAuthorized("Admin"), registerAdmin);


export default router;