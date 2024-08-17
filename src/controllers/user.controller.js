import {asyncHandler} from "../utils/asyncHandler.js"
import { ErrorApi } from "../utils/ErrorApi.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ResponseApi } from "../utils/ResponseApi.js";

const registerUser=asyncHandler(async(req,res)=>{

    // 1. get user details from frontend
    // 2. validation-should not be empty
    // 3. check if user already exists: username,email
    // 4. check for images, check for required avatar
    // 5. upload them to cloudinary, avatar
    // 6. create user object = create entry in database
    // 7. remove password and refersh token from response
    // 8. check for user creation
    // 9.return response
//================================================================================
    const {username,fullName,email,password}=req.body;
    console.log("email",email);

//================================================================================
    // if(fullName ===""){
    //     throw new ErrorApi(400,"Fullname is required!")
    // }
    if(
        [fullName,username,email,password].some((field) => field?.trim() === "")
    ){
        throw new ErrorApi(400,"All fields are required!!")
    }
//================================================================================

    const existedUser=User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ErrorApi(409, "User with email or username already exists!!")
    }
//================================================================================
    //req.body is given by express, and req.files is given by multer

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ErrorApi(400, "Avatar file is required!!")
    } 

//================================================================================

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ErrorApi(400, "Avatar file is required!!")
    }

//================================================================================ 


    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

//=================================================================================    

    const createdUser = await User.findById(user._id).select(
        //in this select method we will write what we dont want by writing - sign in front
        "-password -refreshToken"
    )

//=================================================================================    

    if(!createdUser){
        throw new ErrorApi(500,"Something went wrong while registering the user")
    }

//=================================================================================    

    return res.status(201).json(
        new ResponseApi(200,createdUser,"User registered successfully!!")
    )


})


export {registerUser}









    // res.status(200).json({
    //     message:"ok"
    // })