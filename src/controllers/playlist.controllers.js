import mongoose from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { ApiRes } from "../utils/ApiRes.js";


const createPlaylist = asynHandler(async (req, res) => {
    const { name, description } = req.body

    if (name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }

    const playlistAlreadyExists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $match: {
                name: name.toLowerCase()
            }
        }
    ])



    if (playlistAlreadyExists.length > 0) {
        throw new ApiError(400, "Playlist with same name already exists")
    }


    const createdPlaylist = await Playlist.create({
        name: name.toLowerCase(),
        description: description || '',
        owner: req.user._id,
    })

    if (!createdPlaylist) {
        throw new ApiError(400, "Failed to create playlist")
    }

    return res
        .status(201)
        .json(
            new ApiRes(201, createdPlaylist, "Playlist created successfully")
        )

})

const addVideoToPlaylist = asynHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to add videos to this playlist")
    }

    if (playlist.playlistVideos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist._id,
        {
            $push: { playlistVideos: videoId }
        }
        , { new: true })

    if (!updatedPlaylist.playlistVideos.includes(videoId)) {
        throw new ApiError(500, "Failed to upload a video")
    }

    return res
        .status(200)
        .json(
            new ApiRes(200, {}, "Video added successfully")
        )
})


const getUserPlaylists = asynHandler(async (req, res) => {
   const {userId} = req.params ;

   if(!userId){
    throw new ApiError(400,"User id missing")
   }

   const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner:new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $unwind:"$playlistVideos"
    },
    {
      $lookup: {
        from: "videos",
        localField: "playlistVideos",
        foreignField: "_id",
        as: "video_details",
      }
    },
    {
      $addFields: {
       video_details:{$first:"$video_details"}
      }
    },
    {
      $group: {
        _id: "$_id", 
        name: { $first: "$name" }, 
        description: { $first: "$description" }, 
        video_details: { $push: "$video_details" }
      }
    },
    {
        $project: {
          name:1,
          description:1,
          video_details:1
        }
      }
  ])

   return res
   .status(200)
   .json(
    new ApiRes(200,userPlaylist,"user playlist fetched successfully")
   )

})

export {
    createPlaylist,
    addVideoToPlaylist,
    getUserPlaylists,
}