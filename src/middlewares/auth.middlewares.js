import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js"
import { asynHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";

const verifyJwt = asynHandler(async (req, _, next) => {
    try {
      const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
      if(!token){
        throw new ApiError(401, "Unauthorized request")
      }
      const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decoded._id).select("-password -refreshToken")

      if(!user){
        throw new ApiError(401,"Unable to find user")
      }
      req.user = user

      next()
    }
    catch (error) {
        throw new ApiError(401, "Invalid Access token")
    }
})

export {verifyJwt}