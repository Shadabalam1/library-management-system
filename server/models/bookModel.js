import mongoose, { Types } from "mongoose";

const bookSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim : true
    }, 
   author :{
        type: String,
        required: true,
        trim : true
    },
     description:{
        type: String,
        required: true,
       
    },
    bookUrl: {
        type: String,
        trim: true,
        validate: {
            validator: (value) => {
                if (!value) return true;
                try {
                    const url = new URL(value);
                    return url.protocol === "http:" || url.protocol === "https:";
                } catch {
                    return false;
                }
            },
            message: "Book URL must be a valid HTTP or HTTPS URL.",
        },
    },
     price:{
        type: Number,
        required: true,
       
    },
     quantity:{
       type: Number,
        required: true,
    },
    availability:{
       type: Boolean,
        default: true,
    },
   
},{
 
        timestamps: true,
    
}
)


export const Book = mongoose.model("Book", bookSchema)