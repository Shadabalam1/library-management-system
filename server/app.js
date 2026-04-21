import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import userRouter from "./routes/userRouter.js";

import expressFileupload from "express-fileupload";
import notifyUser from "./services/notifyUser.js";
import { removeUnverifiedAccount } from "./services/removeUnverifiedAccounts.js";

export const app = express();

config({ path: "./config/config.env" });

// ✅ CORS Setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"]
  })
);

// ✅ Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ File upload
app.use(
  expressFileupload({
    useTempFiles: true,
    tempFileDir: "./temp/",
  })
);

// ✅ Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

// ✅ Background services
notifyUser();
removeUnverifiedAccount();

// ✅ Database connection
connectDB();

// ✅ Error handling middleware
app.use(errorMiddleware);
