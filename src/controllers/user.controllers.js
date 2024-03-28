import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const register = asynHandler(async (req,res) =>{
  const {username,email,fullname,password} = req.body;
  
  if([username,email,fullname,password].some(field => field?.trim() === "")){
    throw new ApiError(400,"All fields are required")
  }
  
 const userAlreadyExist =  await User.findOne({
    $or:[{username},{email}]
  })

  if(userAlreadyExist){
    throw new ApiError(409,"user with same email or password already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if(!avatar){
    throw new ApiError(400,"Avatar is required")
  }

 const user =  await User.create({
    fullname,
    username:username.toLowerCase(),
    email,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500,"Error while registering user")
  }
    return res.status(201).json(
      new ApiRes(200,createdUser,"User created Successfully ")
    )
})

export {register}