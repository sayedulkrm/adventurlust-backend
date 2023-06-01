import express from "express";
import {
    addToPlaylist,
    changePassword,
    deleteMyProfile,
    deleteUser,
    forgetPassword,
    getAllUsers,
    getMyProfile,
    login,
    logout,
    register,
    removeFromPlaylist,
    resetPassword,
    updateProfile,
    updateProfilePicture,
    updateUserRole,
} from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";

import singleUpload from "../middlewares/multer.js";

// =============================   X X X   ========================================

const router = express.Router();

// user login
router.route("/login").post(login);

// user register
router.route("/register").post(singleUpload, register);

// user logout

router.route("/logout").get(logout);

// Get User Profile
router.route("/me").get(isAuthenticated, getMyProfile);

// Delete My Profile
router.route("/me").delete(isAuthenticated, deleteMyProfile);

// Change Password
router.route("/changepassword").put(isAuthenticated, changePassword);

// Update Profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

// Update Profile Picture

router
    .route("/updateprofilepicture")
    .put(isAuthenticated, singleUpload, updateProfilePicture);

// Forgot Password

router.route("/forgotpassword").post(forgetPassword);

// Reset Password
router.route("/resetpassword/:token").put(resetPassword);

// Add to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

// Remove from playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

//
//
// Admin  routes ============================>
//
//

// Get All Users
router.route("/admin/users").get(isAuthenticated, authorizedAdmin, getAllUsers);

// Update User Role
router
    .route("/admin/user/:id")
    .put(isAuthenticated, authorizedAdmin, updateUserRole)
    .delete(isAuthenticated, authorizedAdmin, deleteUser);

//
// router.route("/admin/user/:id").delete(isAuthenticated, authorizedAdmin);

//
export default router;
