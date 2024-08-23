import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ErrorApi } from "../utils/ErrorApi.js"
import { ResponseApi } from "../utils/ResponseApi.js"

const createTweet = asyncHandler(async (req, res) => {
    //create tweet
    const {content} = req.body;
    if(!content){
        throw new ErrorApi(400,"content required")
    }
    const tweet = await Tweet.create({
        content,
        owner : req.user?._id,
    });
    if(!tweet){
        throw new ErrorApi(500,"Creation of tweet failed")
    }

    return res
    .status(200)
    .json(
        new ResponseApi(200, tweet,"Tweet created successfully!!")
    )
    
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    //get user tweets

    const {userId} =req.params;

    if(!isValidObjectId(userId)){
        throw new ErrorApi(400, "userId is invalid")
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"likeDetails",
                pipeline:[
                    {
                        $project:{
                            likedBy:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likeDetails" // The value of likesCount is computed using the $size operator, which returns the number of elements in an array.
                },
                ownerDetails:{
                    $first:"$ownerDetails" // The $first operator returns the first element of an array. // it's used to extract the first element of the ownerDetails array. This is useful if ownerDetails is an array but you only care about the first element.

                },
                isLiked:{
                    $cond:{
                        if:{$in: [req.user?._id,"$likeDetails.likedBy"]}, //if condition uses the $in operator to check if req.user?._id (the current user's ID) is present in the likedBy field of any document within the likeDetails array.
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                content:1,
                ownerDetails:1,
                likesCount:1,
                createdAt:1,
                isLiked:1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ResponseApi(200,tweets,"Fetched Tweets successfully ")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //update tweet
    const {content}=req.body;
    const {tweetId} =req.params

    if(!content){
        throw new ErrorApi(400, "content required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ErrorApi(400,"Invalid tweet")
    }

    const tweet =await Tweet.findById(tweetId);

    if(!tweet){
        throw new ErrorApi(404, "Not found Tweet")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can edit thier tweet");
    }
    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!newTweet) {
        throw new ApiError(500, "Failed to edit tweet..try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //delete tweet

    const {tweetId} =req.params;

    if(!isValidObjectId(tweetId)){
        throw new ErrorApi(400,"TweetId invalid")
    }

    const tweet =await Tweet.findById(tweetId)
    if(!tweet){
        throw new ErrorApi(400,"Tweet not found!!")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ErrorApi(401,"Only tweet admin can delete a tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ResponseApi(200,{tweetId},"tweet deleted successfully!!")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}