import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/errorMiddleware.js"
import { User } from "../models/userModel.js"

import bcrypt from "bcrypt"
import {v2 as cloudinary } from "cloudinary"


export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({ accountVerified: true }); 
    res.status(200).json({
        success: true,
        users,
    });

});


export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {

    if (!req.files  || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Admin avatar is required.", 400));
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("please filled all field.", 400));
        
    }

    const isRegistered = await User.findOne({ email, accountVerified: true });

    if (isRegistered) {
        return next(new ErrorHandler("user all ready registered.", 400));
        
    }

    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("password must be between 8 to 16 charecters long.", 400));
       
    };
  

    

        const { avatar } = req.files;
        const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

        if (!allowedFormats.includes(avatar.mimetype)) {
        return next(new ErrorHandler("file format not supported.", 400));
            
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const cloudinaryResponse = await cloudinary.uploader.upload(
            avatar.tempFilePath, {
                folder: "LMS_ADMIN_AVATARS"
            }

        )

        
if (!cloudinaryResponse || cloudinaryResponse.error) {
    const errorMessage = cloudinaryResponse?.error || "Unknown Cloudinary error";
    console.error("❌ Cloudinary Error:", errorMessage);
    
    return next(
        new ErrorHandler("failed to upload avatar image to cloudinary.", 500)
    )

}

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Admin",
        accountVerified: true,
        avatar:{
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }
    });

    res.status(201).json({
        success: true,
        message: "Admin registered successfully.",
        admin,
    })

});
