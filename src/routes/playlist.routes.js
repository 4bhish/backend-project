import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { addVideoToPlaylist, createPlaylist, getUserPlaylists } from "../controllers/playlist.controllers.js";

const router = Router()

router.route('/create-playlist').post(verifyJwt,createPlaylist)
router.route('/:playlistId/videos/:videoId').put(verifyJwt,addVideoToPlaylist)
router.route('/get-playlist/:userId').get(getUserPlaylists)

export default router