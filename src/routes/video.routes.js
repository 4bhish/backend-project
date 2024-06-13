import { Router } from "express";
import { publishVideo } from "../controllers/video.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router()


router.route('/publish-video').post(verifyJwt, upload.fields(
    [{
        name: 'videoFile',
        maxCount: 1
    },
    {
        name:'thumbnail',
        maxCount:1
    }]
), publishVideo)


export default router