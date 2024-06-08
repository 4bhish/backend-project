import mongoose, { Types } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  }
  catch (error) {
    throw new ApiError(500, "error while creating user")
  }
}

const register = asynHandler(async (req, res) => {

  const { username, email, fullname, password } = req.body;

  if ([username, email, fullname, password].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required")
  }

  const userAlreadyExist = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (userAlreadyExist) {
    throw new ApiError(409, "user with same email or password already exists")
  }

  let avatarLocalPath;
  if (req.files.avatar) {
    if (Array.isArray(req.files.avatar)) {
      avatarLocalPath = req.files.avatar[0].path;
    }
  }

  if (!avatarLocalPath) {
    throw new ApiError(401, "Failed to upload avatar ")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar) {
    throw new ApiError(400, "Avatar is required")
  }


  let coverImageLocalPath;
  if (req.files) {
    if (Array.isArray(req.files.coverImage)) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if (!createdUser) {
    throw new ApiError(500, "Error while registering user")
  }
  return res.status(200).json(
    new ApiRes(201, createdUser, "User created Successfully ")
  )
})

const login = asynHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(401, "Username or email is required")
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!userExist) {
    throw new ApiError(404, "user with same username or email not found")
  }

  const passwordCorrect = await userExist.isPasswordCorrect(password)

  if (!passwordCorrect) {
    throw new ApiError(409, "Invalid user credentials")
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(userExist._id)

  const userLogged = await User.findById(userExist._id).select("-password -refreshToken")


  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRes(201, {
        user: userLogged, accessToken, refreshToken,
      },
        "user logged in successfully")
    )
})

const logout = asynHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      refreshToken: undefined
    }
  }, {
    new: true
  })

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiRes(200, {}, "User logged out successfully")
    )
})

const refreshAccessToken = asynHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access")
  }

  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  const user = await User.findById(decoded._id)

  if (!user) {
    throw new ApiError(401, "Unauthorized access")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  return res
    .status(201)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true
    })
    .json(
      new ApiRes(200, {
        accessToken,
        refreshToken
      }, "access token Refreshed")
    )
})

const changeUserPassword = asynHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id)

  const oldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!oldPasswordCorrect) {
    throw new ApiError(401, "Old password incorrect")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(201)
    .json(
      new ApiRes(200, {
      }, "Passoword changed successfully")
    )
})

const getCurrentUser = asynHandler(async (req, res) => {
  const currentUser = req.user;

  return res
    .status(201)
    .json(
      new ApiRes(200, currentUser, "Current User fetched successfully")
    )
})

const updateUserDetails = asynHandler(async (req, res) => {
  const { fullname, email, } = req.body
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email
      }
    },
    {
      new: true
    }).select("-password -refreshToken")

  return res
    .status(200)
    .json(
      new ApiRes(201, user, "User details updated successfully")
    )
})

const updateAvatar = asynHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    throw new ApiError(401, "Unauthorized access")
  }

  let avatarLocalPath

  if (req.file) {
    avatarLocalPath = req.file.path
  }

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar) {
    throw new ApiError(401, "failed to upload Avatar")
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, {
    $set: {
      avatar: avatar.url
    }
  }, { new: true }).select("-password -refreshToken")

  return res
    .status(200)
    .json(
      new ApiRes(200, {
        user: updatedUser
      },
        "avatar updated successfully"
      )
    )
})

const updateCover = asynHandler(async (req, res) => {

  const user = await User.findById(req.user._id)

  if (!user) {
    throw new ApiError(409, "unauthorized access")
  }

  let coverImageLocalPath

  if (req.file) {
    req.file.path = coverImageLocalPath
  }

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image not found")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage) {
    throw new ApiError(400, "failed to upload cover image")
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, {
    $set: {
      coverImage: coverImage.url
    }
  }, { new: true }).select("-password -refreshToken")

  return res
    .status(200)
    .json(
      new ApiRes(200, updatedUser, "CoverImage Uploaded successfully")
    )

})


const getUserChannelProfile = asynHandler(async (req, res) => {
  const { username } = req.params

  if (!username) {
    throw new ApiError(401, "Username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username
      }
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: "channel",
        as: 'subscribers'
      }
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: "subscriber",
        as: 'subscribedTo'
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers"
        },
        channelsSubscribedTo: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: "true",
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscriberCount: 1,
        channelsSubscribedTo: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1
      }
    }
  ])

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found")
  }

  return res
    .status(200)
    .json(
      new ApiRes(201, channel[0], "user channel fetched successfully")
    )
})

const getWatchHistory = asynHandler(async (req, res) => {

  const user = await User.aggregate([

    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])


  return res
    .status(200)
    .json(
      new ApiRes(200, user[0].watchHistory, "watch history fetched successfully")
    )

})




export {
  register,
  login,
  logout,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  updateCover,
  getUserChannelProfile,
  getWatchHistory,
}