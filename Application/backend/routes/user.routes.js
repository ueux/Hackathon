import { Router } from "express";
import { getAllUsers,updateUserById,getUserById,deleteUserById,updateUserData,getUserProfile, createUser, loginUser, logoutUser, changeCurrentPassword } from "../controllers/user.controllers.js";

import { onlyForAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/signin').post(createUser)
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/").get(verifyJWT,onlyForAdmin,getAllUsers)
router.route("/profile").get(verifyJWT, getUserProfile).put(verifyJWT, updateUserData)
router.route("/password").put(verifyJWT, changeCurrentPassword)
router.route("/:id").delete(verifyJWT, onlyForAdmin, deleteUserById).get(verifyJWT,onlyForAdmin, getUserById).put(verifyJWT,onlyForAdmin, updateUserById)

export default router;