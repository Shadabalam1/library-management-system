import mongoose from "mongoose";

export const connectDB =  ()=>{
    mongoose.connect(process.env.MONGO_URI, {
        dbname : "LMS"
    }).then(()=>{
        console.log("Database connected succesfully ")
    }).catch((err)=>{
        console.log("Error connectin to database" ,err)

    })
}