import { Router } from "express";
import { changeUserPassword, getCurrentUser, getWatchHistory, login, logout, refreshAccessToken, register, updateAvatar, updateUserDetails } from "../controllers/user.controllers.js";
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
router.route('/get-current-user').post(verifyJwt,getCurrentUser)
router.route('/update-user-details').post(verifyJwt,updateUserDetails)
router.route('/update-avatar').post(upload.single("avatar"),
verifyJwt,
updateAvatar
)
router.route('/user-watch-history').post(verifyJwt,getWatchHistory)


export default router