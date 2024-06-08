import { Router } from "express";
import { changeUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, login, logout, refreshAccessToken, register, updateAvatar, updateCover, updateUserDetails } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    register
)
router.route('/login').post(login)

router.route('/logout').post(verifyJwt, logout)
router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').post(verifyJwt,changeUserPassword)
router.route('/current-user').post(verifyJwt,getCurrentUser)
router.route('/update-userdetails').patch(verifyJwt,updateUserDetails)

router.route('/update-avatar').patch(verifyJwt,upload.single("avatar"),
updateAvatar
)
router.route('/update-coverimage').patch(verifyJwt,upload.single("coverImage"),
updateCover
)

router.route('/channel/:username').get(verifyJwt,getUserChannelProfile)
router.route('/watch-history').get(verifyJwt,getWatchHistory)


export default router