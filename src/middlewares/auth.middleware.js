//this will verify is user is present or not

import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorApi } from "../utils/ErrorApi.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        if(!token){
            throw new ErrorApi(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ErrorApi(401,"Invalid access Token")
        }
    
        req.user=user;//add new object name user in request
        next();

    } catch (error) {
        throw new ErrorApi(401,error?.message || "Invalid sccess Token")
    }

})