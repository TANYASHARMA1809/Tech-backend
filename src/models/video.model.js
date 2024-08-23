import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema=new Schema(
    {
        videoFile:{
            type:{
                url :String,
                public_id:String
            },
            required:true
        },
        thumbnail:{
            type:{
                url :String,
                public_id:String
            },
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number, //will get duration by cloudinary
            required:true
        },
        views:{
            type:Number,
            defaultValue:0
        },
        isPublished:{
            type:Boolean,
            required:true,
            defaultValue: false,
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },{timestamps:true}
)
//aggregration pipeline
videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoSchema)