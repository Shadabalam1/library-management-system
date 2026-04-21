import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/errorMiddleware.js"
import { User } from "../models/userModel.js"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { sendVerificationCode } from "../utils/sendVerificationCode.js"
import { sendToken } from "../utils/sendToken.js"
import { sendEmail } from "../utils/sendEmail.js"
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js"
import { v2 as cloudinary } from "cloudinary"


export  const register = catchAsyncErrors(async (req, res, next)=>{
    try{
        const {name, email, password}= req.body;
        if (!name || !email ||!password) {
            return next (new ErrorHandler("please enter all field.", 400));
        }

        const isRegistered = await User.findOne({email, accountVerified: true });
        if (isRegistered) {
            return next(new ErrorHandler("User already exists", 400))
        }
        const registerAttempsByUser = await User.find({
            email,
            accountVerified: false,
        });

        // isko 5 karna h 
        if (registerAttempsByUser.length >= 10) {
            return next(
                new ErrorHandler(
                    "You have exceeded of registration attemps. please contact support.", 400
                )
            );
        }
         if(password.length < 8 || password.length > 16) {
        return  next (
            new ErrorHandler("password must be beetween 8 and 16 charecteers.", 400)
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name,
        email,
        password:hashedPassword,
    })
    
    const verificationCode = await user.generateVerificationCode()
     await user.save();
     sendVerificationCode(verificationCode, email, res)
    }
   
    catch (error){
        next(error);
    }
});


export const verifyOTP = catchAsyncErrors(async (req, res, next) =>{
    const {email, otp} = req.body;

    if (!email || !otp) {
        return next(new ErrorHandler("Email or OTP is missing.", 400))
    }

    try {
        const userAllEntries = await User.find({
            email,
            accountVerified:false,
        }).sort({createdAt: -1})

        if (!userAllEntries) {
            return next(new ErrorHandler("User not found", 404))
        }


        let user;

        if (userAllEntries.length > 1) {
            user = userAllEntries[0];
            await User.deleteMany({
                _id: {$ne: user._id},
                email,
                accountVerified: false,

            })
        } else{
            user = userAllEntries[0];
        }

        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler("Invalid OTP.", 400))
        }


            const currentTime = Date.now();
 
            const verificationCodeExpire = new Date(
                user.verificationCodeExpire
            ).getTime();

            if (currentTime > verificationCodeExpire) {
                return next(new ErrorHandler("OTP expired.", 400))
            }

            user.accountVerified = true;
            user.verificationCode = null;
            user.verificationCodeExpire = null;
            await user.save({validateModifiedOnly: true });


            sendToken(user, 200, "Account Verified.", res );

    } catch (error) {
        return next(new ErrorHandler("Internal Server Error", 500))
    }
}) 


export const login = catchAsyncErrors(async (req, res, next)=> {
    
    const {email, password } = req.body;

    if (!email || !password) {
        
         return next(new ErrorHandler("Please enter all fields. ", 400));

    }
   

const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
);

if (!user) {
    return next (new ErrorHandler("Invalid email or password.", 400));
}

const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
    return next (new ErrorHandler("Invalid email or password.", 400));
}
sendToken(user, 200, "user login successfully.", res)
});


export const logout = catchAsyncErrors(async(req, res, next) =>{
    res
    .status(200)
    .cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    })
    .json({
        success: true,
        message: "Logged out successfully.",

    });
})


export const getUser = catchAsyncErrors(async(req, res, next)=>{
    
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    })
})


export const forgotPassword = catchAsyncErrors(async (req, res, next) =>{

    if (!req.body.email) {
 return next(new ErrorHandler("Email is required.", 400))
        
    }


    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true,
    });


    if (!user) {
        return next(new ErrorHandler("Invalid email.", 400));
    }


const resetToken = user.getResetPasswordToken(); 

await user.save({ validateBeforeSave: false });

const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

console.log("forgotPassword: Email URL generated", resetPasswordUrl); // Better log

try {
  await sendEmail({
    email: user.email,
    subject: "Learn Hub Password Recovery",
    message,
  });

  res.status(200).json({
    success: true,
    message: `Email sent to ${user.email} successfully.`,
  });
} catch (error) {
  // 🔒 Security: Clear token from DB
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // 📝 Log actual error (server-side only)
  console.error("Email sending failed:", error.message);
  console.error("Stack trace:", error.stack);

  // 🛑 Don't expose internal error to client
  return next(
    new ErrorHandler(
      "Failed to send password reset email. Please try again later.",
      500
    )
  );
}


 })


export const resetPassword = catchAsyncErrors(async (req, res, next) =>{
    const {token} = req.params;
    const resetPasswordToken = crypto.createHash("sha256")
    .update(token)
    .digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler(
            "Reset password token or has been expired",
             400
            ))
    }

    if (req.body.password !== req.body.confirmPassword) {
         return next(new ErrorHandler(
            "password & confirm password do not match",
             400
            ))
          
    }

     if (req.body.password.length < 8 ||
        req.body.password.length > 16 ||
        req.body.confirmPassword.length < 8 ||
        req.body.confirmPassword.length > 16
     ){

    return next(new ErrorHandler("password must be between 8 and 16 charector", 400 ))
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  user.password = hashedPassword
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, "password reset successfully.", res)
  
})
 

export const updatePassword = catchAsyncErrors(async (req, res, next) =>{
     const user = await User.findById(req.user._id).select("+password");
     const {currentPassword, newPassword, confirmPassword }=req.body

     if (!currentPassword || !newPassword || !confirmPassword ) {
        return next(new ErrorHandler(" please enter all fields.", 400));
     }

     const isPasswordMatched = await bcrypt.compare(
        currentPassword,
        user.password
     );

     if (!isPasswordMatched) {
        return next(new ErrorHandler(" current password is incorrect.", 400));
        
     }
 if (newPassword.length < 8 ||
    newPassword.length > 16 ||
    confirmPassword.length < 8 ||
    confirmPassword.length > 16
     ){

    return next(new ErrorHandler("password must be between 8 and 16 charector", 400 ))
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("new password or confirm newpassword not matched.", 400 ))
    
  }


  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "password updated. ",
  });
})



export const uploadProfilePic = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.profilePic) {
    return next(new ErrorHandler("Please upload a profile picture", 400));
  }

  const file = req.files.profilePic;

  // Validate file type
  const allowedFormats = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
  if (!allowedFormats.includes(file.mimetype)) {
    return next(new ErrorHandler("Invalid file format. Only PNG, JPEG, JPG, WEBP allowed.", 400));
  }

  if (file.size > 2 * 1024 * 1024) {
    return next(new ErrorHandler("Image size should be less than 2MB", 400));
  }

  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(
      file.tempFilePath,
      {
        folder: "LMS_USER_PROFILE_PICS",
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" }
        ]
      }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      const errorMessage = cloudinaryResponse?.error?.message || "Unknown Cloudinary error";
      console.error("❌ Cloudinary Error:", errorMessage);
      return next(new ErrorHandler("Failed to upload image to Cloudinary", 500));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        avatar: {
          Public_id: cloudinaryResponse.public_id,
          url: cloudinaryResponse.secure_url
        }
      },
      { new: true, runValidators: true, select: "-password" }
    );

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      avatarUrl: cloudinaryResponse.secure_url, 
      user
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return next(new ErrorHandler("Profile picture upload failed", 500));
  }
});


export const adminLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const user = await User.findOne({ email, role: "Admin", accountVerified: true }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid admin credentials", 400));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid admin credentials", 400));
  }

  sendToken(user, 200, "Admin login successful", res);
});



export const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: "Admin"
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



// LAST ME YE ADD KAREIN:

export const getResetPasswordToken = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  
  // Token verify karein
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token"
    });
  }

  // Frontend page par redirect karein
  res.redirect(`${process.env.FRONTEND_URL}/password/reset/${token}`);
});