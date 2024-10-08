import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true // in db if we want to add searching field
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //will use cloudinary url
            required:true,
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String //encoded tokens 
        }
    },{timestamps:true}
)


//next is for middleware which holds a flag value and passes the value to next field
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)//10 rounds,give any number of hash rounds for salts 
    next()
})


userSchema.methods.isPasswordCorrect = async function(password){
     return await bcrypt.compare(password,this.password)
}

// access token is not going to save in db
// access token is short lived
// refresh token is long lived
// access token ko jldi expire krdia jata hai
// jab tk access token hai user k ps tb tk vo authentication kar skta hai
// if login session is expired within 15min then we keep save refresh token in database as well as with user
// user ko validate toh access token se he krte hai
// par har br access token dalne ki jarurt nhi hai, agr user k ps refresh token hai toh ek end point hit krdo
// agr access token or refresh token sme hogye toh nya access token dedega server user ko


userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName,
            username:this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
)
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            // email:this.email,
            // fullName:this.fullName,
            // username:this.username
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
)
}


//JWT is wearer token..means someone who wears that specofoc token that can only have access of data

export const User=mongoose.model("User",userSchema)
