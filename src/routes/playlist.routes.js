import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controllers.js";

const router = Router()

router.route('/create-playlist').post(verifyJwt,createPlaylist)
router.route('/:playlistId/videos/:videoId').patch(verifyJwt,addVideoToPlaylist)
router.route('/get-playlist/:userId').get(getUserPlaylists)
router.route('/remove-video/:playlistId/:videoId').patch(verifyJwt,removeVideoFromPlaylist)
router.route('/delete-playlist/:playlistId').delete(verifyJwt,deletePlaylist)
router.route('/update-playlist/:playlistId').patch(verifyJwt,updatePlaylist)


export default router