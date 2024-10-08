import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
        const connectInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongodb connected! DB host : ${connectInstance.connection.host}`)
    }catch(error){
        console.log("MongoDB connection error",error);
        process.exit(1)
    }
}

//we make utility file for above function and make a wrapper function in which we can execute the code

export default connectDB;