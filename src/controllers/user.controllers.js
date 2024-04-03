import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asynHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar is required")
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

const login = asynHandler(async (req, res) => {
  //  first check if user has sent all required detailed
  // check if user exist with those details
  // check password
  // generate acceess and refresh token
  // give response

  const { username, email, password } = req.body
  if (!username || !email) {
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
})

export {
  register,
  login,
  logout
}