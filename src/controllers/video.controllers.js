import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiRes } from "../utils/ApiRes.js";

const publishVideo = asynHandler(async(req,res) =>{
    const {title,description} = req.body
    if(title.trim() === "" && description.trim("") === ""){
        throw new ApiError(401, "Title and description for a video is required" )
    }

    let videoLocalFilePath
    if(req.files){
        if(Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0){
            videoLocalFilePath = req.files.videoFile[0].path
        }
    }

    if(!videoLocalFilePath){
        throw new ApiError(400,"Video file upload failed")
    }
    const videoFile = await  uploadOnCloudinary(videoLocalFilePath)

    if(!videoFile){
        throw new ApiError(400,"No video File uploaded")
    }
   

    let thumbnailLocalPath
    if(req.files){
        if(Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0){
            thumbnailLocalPath = req.files.thumbnail[0].path
        }
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail upload failed")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400,"Thumbnail failed to upload")
    }

    const owner = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $project:{
                username:1,
                fullname:1,
                email:1
            }
        }
    ])
    console.log(owner)

    if(!owner){
        throw new ApiError(401,"Unauthorized access")
    }

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title:title,
        description:description,
        duration:videoFile.duration,
        owner:owner[0]._id
    })

    if(!video){
        throw new ApiError(500,"failed to upload video")
    }

    return res
    .status(200)
    .json(
        new ApiRes(200,video,"Video Uploaded successfully")
    )

})


export {
    publishVideo
}