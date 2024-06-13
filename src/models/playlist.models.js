import { model, Schema } from "mongoose";

const playlistSchema  = new Schema({
    name:{
        type:String,
        required:true,
        index:true,
    },
    description:{
        type:String,
    },
    playlistVideos:[
        {
            type:Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
},{
    timestamps:true
})

export const Playlist = model('Playlist',playlistSchema)