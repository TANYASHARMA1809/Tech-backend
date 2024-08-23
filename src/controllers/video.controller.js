import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { ErrorApi } from "../utils/ErrorApi.js"
import { ResponseApi } from "../utils/ResponseApi.js"
import { Like } from "../models/like.model.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //get all videos based on query, sort, pagination


    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'


    console.log(userId);

    const pipeline =[]

    if(query){
        pipeline.push({
            $search:{
                index:"search-videos",
                text:{
                    query:query,
                    //path will search for title and description
                    path:["title","description"]
                }
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ErrorApi(401,"Invalid userId")
        }
        pipeline.push({
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    //fetch videos only that is true for isPublished

    pipeline.push({
        $match:{
            isPublished:true
        }
    })



    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)

    if(sortBy && sortType){
        pipeline.push({
            $sort:{
                [sortBy]: sortType === " asc" ? 1 :-1
            }
        })
    }else{
        pipeline.push({
            $sort:{
                createdAt:-1
            }
        })
    }
    pipeline.push({
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerDetails",
            pipeline:[
                {
                    $project:{
                        username:1,
                        "avatar-url":1
                    }
                }
            ]
        }
    },{$unwind : "$ownerDetails"}) //If false, if path is null, missing, or an empty array, $unwind does not output a document. The default value is false.

// $match: Filters documents based on a specified condition (similar to the find query).
// $group: Groups documents by a specified key and can perform operations on the grouped data (e.g., summing values).
// $project: Reshapes the documents by including, excluding, or adding new fields.
// $sort: Orders the documents based on a specified field.
// $limit: Restricts the number of documents passed to the next stage.
// $lookup: Performs a join with another collection.
// $unwind: Deconstructs an array field from the input documents to output a document for each element of the array.



// The core of MongoDB's aggregation is the pipeline, which is an array of stages. Each stage performs an operation on the input documents (which can come from a collection or the result of the previous stage) and passes the results to the next stage.
// Think of it as a sequence of steps where each step refines or transforms the data in some way.

    //aggregate method is used to perform complex queries and transformations on your MongoDB collections. It allows you to process data and return computed results.
   const videoAggregate = Video.aggregate(pipeline)

   const options ={
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
   }


//  Pagination: Pagination is the process of dividing a large set of data into smaller chunks (pages) and retrieving a specific chunk based on the user's request. This is particularly useful in web applications where displaying all records at once is impractical.
// Aggregation: As previously explained, aggregation is used to process data through a series of stages (e.g., filtering, grouping, sorting) to compute results. aggregatePaginate allows these complex operations to be combined with pagination.



// The mongoose-aggregate-paginate-v2 plugin allows you to apply pagination to your aggregation pipelines. 
// Instead of retrieving all results at once, you can specify how many documents to retrieve per page and which page to retrieve.


const video =await Video.aggregatePaginate(videoAggregate,options)

   return res
   .status(200)
   .json(
    new ResponseApi(200,video,"Feched video successfully")
   )

})


const publishAVideo = asyncHandler(async (req, res) => {
    
    // get video, upload to cloudinary, create video

    const { title, description} = req.body

    if([title,description].some((field) => field?.trim() === "")){
        throw new ErrorApi(400, "All files are required!!")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoFileLocalPath){
        throw new ErrorApi(400, "videofilepath is reqired")
    }

    if(!thumbnailLocalPath){
        throw new ErrorApi(400, "thumbnailfilepath is reqired")
    }

    const videoFile =await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(400, "Video file not found");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail not found");
    }

    const video =await Video.create({
        description,
        title,
        duration : videoFile.duration,
        videoFile:{
            url:videoFile.url,
            public_id:videoFile.public_id
        },
        thumbnail:{
            url:thumbnail.url,
            public_id:thumbnail.public_id
        },
        isPublished:false,
        owner:req.user?._id
    })

    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res.status(200).json(new ResponseApi(200,video,"Video uploaded!!"))

})

const getVideoById = asyncHandler(async (req, res) => {
    
    // get video by id

    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ErrorApi(400,"Invalid videoId")
    }

    if(!isValidObjectId(req.user?._id)){
        throw new ErrorApi(400, "Invalid userId")
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)           
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount:{
                                $size: "$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    },
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    if:{$in:[req.user?._id,"$likes.likedBy"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $project:{
                "videoFile.url": 1,
                 title: 1,
                 description: 1,
                 views: 1,
                 createdAt: 1,
                 duration: 1,
                 comments: 1,
                 owner: 1,
                 likesCount: 1,
                 isLiked: 1
            }
        }

                    
    ])

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }
    
    //increase views when video fetched successfully
    await Video.findByIdAndUpdate(videoId,{
        $inc:{
            views:1
        }
    })

    // add video to user watch history
    await User.findByIdAndUpdate(req.user?._id,{
        $addToSet:{
            WatchHistory:videoId
        }
    })

    return res
    .status(200)
    .json(
        new ResponseApi(200,video[0],"video details fetched")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    
    // update video details like title, description, thumbnail
    const { videoId } = req.params;
    const {title,description}=req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description required");
    }

    const video =await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ErrorApi(400, "Owner can only update the video")
    }

    const thumbnailDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError(400, "not found thumbnail ");
    }

    const updatedVideo =await Video.findByIdAndUpdate(videoId,{
        $set:{
            description,
            title,
            thumbnail:{
                public_id:thumbnail.public_id,
                url:thumbnail.url
            }
        }
    },{new:true}) //Mongoose will return the document after the update has been applied.

    if(!updatedVideo){
        throw new ApiError(500, "Failed to update video please try again");
    }

    if(updatedVideo){
        await deleteOnCloudinary(thumbnailDelete) //delete bfore one
    }

    return res
    .status(200)
    .json(new ResponseApi(200,updatedVideo,"video updated!!"))


})


const deleteVideo = asyncHandler(async (req, res) => {
    // delete video
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ErrorApi(400,"videoId invalid")
    }

    const video =await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "Can't delete as you are not the owner"
        );
    }

    const videoDelete = await Video.findByIdAndDelete(video?._id);

    if (!videoDelete) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.videoFile.public_id,"video")
    await deleteOnCloudinary(video.thumbnail.public_id)

    await Comment.deleteMany({
        video:videoId
    })
//remember them to delete
    await Like.deleteMany({
        video:videoId
    })

    return res
    .status(200)
    .json(new ResponseApi(200,{},"wohoo..video deleted!"))
    

})


// toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "can't toogle publish status as you are not owner"
        );
    }

    const toggleVideo = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:!video?.isPublished,

        },

    },{new:true})

    if(!toggleVideo){
        throw new ErrorApi(500,"Server failed to toogle video publish status")
    }

    return res.status(200).json(
        new ResponseApi(200,{isPublished: toggleVideo.isPublished},"Video is publish and toggled")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}