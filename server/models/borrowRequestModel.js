
import mongoose from "mongoose";

const borrowRequestSchema = new mongoose.Schema({
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    book: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        }
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    requestType: {
        type: String,
        enum: ["borrow", "return"],
        default: "borrow"
    },
    borrow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Borrow"
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    approvedDate: {
        type: Date
    },
    rejectedDate: {
        type: Date
    },
    returnRequestedDate: {
        type: Date
    },
    processedDate: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    fine: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const BorrowRequest = mongoose.model("BorrowRequest", borrowRequestSchema);