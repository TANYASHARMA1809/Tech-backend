import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ErrorApi } from "../utils/ErrorApi.js"
import { ResponseApi } from "../utils/ResponseApi.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //get all comments for a video

    const {videoId} = req.params //Figuring Out Route Things
    const {page = 1, limit = 10} = req.query //Dealing with URL Stuff

    const video = await Video.findById(videoId);
    if(!video){
        throw new ErrorApi(404,"Video not found")
    }

    const aggregateComments = Comment.aggregate([
        {
            $match:{
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        { 
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
           }  
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner:{
                    $first : "$owner"
                },
                isLiked:{
                    $cond:{
                        if:{$in: [req.user?._id, "$likes.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                content :1,
                createdAt:1,
                likesCount:1,
                isLiked:1,
                owner:{
                    username:1,
                    fullName:1,
                    "avatar.url":1
                }
            }
        },
        {
            $sort:{ // $sort stage is used to order documents in a specified order, either ascending (1) or descending (-1), based on one or more fields.
                createdAt : -1
            }
        }
    ])

    const options={
        limit :parseInt(limit,10),
        page:parseInt(page,10)
    };

    const comments = await Comment.aggregatePaginate(
        aggregateComments, 
        options
    )

    return res
    .status(200)
    .json(
        new ResponseApi(200, comments, "Fetched comments successfulyy !!")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    const {videoId} =req.params;
    const {content} =req.body

    if(!content){
        throw new ErrorApi(400, "Content must be required")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ErrorApi(404, "NOT found video");
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    });
    if(!comment){
        throw new ErrorApi(500, "failed to add comment please try again")
    }

    return res
    .status(200)
    .json(
        new ResponseApi(202, comment,"comments added succesfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // update a comment

    const {commentId} = req.params;
    const {content}=req.body

    if(!content){
        throw new ErrorApi(400,"content required!!")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ErrorApi(404, "Comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ErrorApi(400, "Comment owner can only update")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set:{
                content
            }
        },
        {new :true}
    )
    if(!updateComment){
        throw new ErrorApi(500, "Updation of comment failed..try again")
    }

    return res
    .status(200)
    .json(
        new ResponseApi(200, updateComment,"comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment

    const {commentId}=req.params;

    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ErrorApi(404,"Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ErrorApi(400,"Comment can by deleted by owner only")
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment:commentId,
        likedBy:req.user
    });

    return res
    .status(200)
    .json(
         new ResponseApi(200,{commentId},"Comment deleted!!")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }