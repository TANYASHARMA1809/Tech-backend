import {asyncHandler} from "../utils/asyncHandler.js"
import { ErrorApi } from "../utils/ErrorApi.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ResponseApi } from "../utils/ResponseApi.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken =user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave : false}) //this validateBeforeSave is for password not checking..here we are saving refresh token in db

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ErrorApi(500,"Something went wrong while generating refresh and access token")
    }
}

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
    
    //console.log("email",email);
   // console.log(req.body)

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

    const existedUser=await User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ErrorApi(409, "User with email or username already exists!!")
    }
//================================================================================
    //req.body is given by express, and req.files is given by multer
    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;

    //const coverImageLocalPath = req.files?.coverImage[0]?.path;//gives error

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }
    

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

const loginUser = asyncHandler(async(req,res)=>{

    // take data from request body
    // username or email is present or not
    // find the user
    // password check
    // access and refresh token both will be generated
    // send cookie

//=================================================================================

    const {email,username,password}=req.body;


//=================================================================================

    if(!username && !email){
        throw new ErrorApi(400,"username or email is required!!")
    }

//=================================================================================

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        throw new ErrorApi(404,"User not found")
    }
//=================================================================================

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ErrorApi(401,"Invalid user credentials")
    }

//=================================================================================

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);


//=================================================================================

    const loggedInUser =await User.findById(user._id).select("-password -refershToken")  


//now for sending cooke we design some optins in which secure and httpOnly is true by ehich we can only modify cookie by server

    const options = {
        httpOnly : true,
        secure :true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ResponseApi(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser =asyncHandler(async(req,res)=>{
    //req.user is coming from verifyJWT from auth middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined // mongodb operator set is used to give object and update that field
            }
            
        },
        {
            new :true //return mai jo value milegi vo new updated value milegi
        }
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ResponseApi(200,{}, "user logged out successfully"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ErrorApi(401,"unauthorized error") 
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET     
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ErrorApi(401,"invalid refresh token") 
        }
    
        if(incomingRefreshToken !== user?.refreshToken ){
            throw new ErrorApi(401,"Referesh error is expired or use")
    
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ResponseApi(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed !!"
            )
        )
    } catch (error) {
        throw new ErrorApi(401,error.message || "Invalid refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} =req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ErrorApi(400,"Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ResponseApi(200,{},"Password changed successfully!!"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched succesfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName, email}=req.body

    if(!fullName || !email){
        throw new ErrorApi(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new :true} //update hone ke baad jo info hai vo return hoti hai
    ).select("-password")

    return res
    .status(200)
    .json(new ResponseApi(200,user,"Account details updated"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ErrorApi(400,"Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ErrorApi(400,"Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ResponseApi(200,user,"Avatar updated successfullyy")
    )


})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath =req.file?.path
    if(!coverImageLocalPath){
        throw new ErrorApi(400,"CoverImage is missing")
    }

    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ErrorApi(400,"Error while uploading coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ResponseApi(200,user,"Cover Image updated successfully")
    )

})


export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}









    // res.status(200).json({
    //     message:"ok"
    // })