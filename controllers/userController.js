import { catchAsyncError } from "../middlewares/catchAsyncError.js";

import ErrorHandler from "../utils/errorHandler.js";

import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/stats.js";

// =================================================================
// =======================    Function Start    ====================
// =================================================================

// Register User

export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

    const file = req.file;

    if (!name || !email || !password || !file) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    let user = await User.findOne({ email });

    if (user) {
        return next(new ErrorHandler("Email already exists", 409));
    }

    // Upload file on cloudinary

    const fileUrl = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
        folder: "courses/users",
    });

    user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        },
    });

    sendToken(res, user, "Register Successfully", 201);
});

// Login User

export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Email or Password is incorrect", 404));
    }

    // Password Check

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorHandler("Email or Password is incorrect", 401));
    }

    sendToken(res, user, `Welcome Back ${user.name}`, 200);
});

// Logout User

export const logout = catchAsyncError(async (req, res, next) => {
    const options = {
        expires: new Date(Date.now()),
        httpOnly: true,
        // secure: true,
        sameSite: "none",
    };

    res.status(200).cookie("token", null, options).json({
        success: true,
        message: "Logged Out Successfully",
    });
});

// Get User Details -> Profile

export const getMyProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        user,
    });
});

// Delete Profile

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
    //
    const user = await User.findById(req.user._id);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id, {
        folder: "courses/users",
    });

    // cancel subscription

    await user.deleteOne();

    res.status(200)
        .cookie("token", null, {
            expires: new Date(Date.now()),
        })
        .json({
            success: true,
            message: `Profile Deleted Successfully`,
        });
});

// Change password

export const changePassword = catchAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new ErrorHandler("Old Password is incorrect", 401));
    }

    user.password = newPassword;

    user.save();

    res.status(200).json({
        success: true,
        message: "Password Changed Successfully",
    });
});

// Update User Details

export const updateProfile = catchAsyncError(async (req, res, next) => {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    user.save();

    res.status(200).json({
        success: true,
        message: "Profile Updated Successfully",
    });
});

// Update User Avatar / Profile  Pictur

export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
    const file = req.file;

    const user = await User.findById(req.user._id);

    const fileUrl = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
        folder: "courses/users",
    });

    await cloudinary.v2.uploader.destroy(user.avatar.public_id, {
        folder: "courses/users",
    });

    user.avatar = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
    });
});

// Forget Password

export const forgetPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save();

    // Send token Via Email

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `Here is your password reset token. Please use it to reset your password. It will expire in 15 minutes. Click here: ${url}. If you did not request this, please ignore this email`;

    await sendEmail(user.email, "Adventure -- Password Reset Token", message);

    res.status(200).json({
        success: true,
        message: `Reset Password Link Sent To ${user.email}`,
    });
});

// Reset Password

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpired: {
            $gt: Date.now(),
        },
    });

    if (!user) {
        return next(
            new ErrorHandler(
                "Reset Password Token is invalid or has been expired",
                400
            )
        );
    }

    user.password = req.body.password;

    if (!user.password) {
        return next(new ErrorHandler("Please enter a new password", 400));
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpired = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password Reset Successfully",
    });
});

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
    //
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id);

    if (!course) {
        return next(
            new ErrorHandler(" Invalid Course ID. Course not found", 404)
        );
    }

    const itemExist = user.playlist.find((item) => {
        if (item.course.toString() === course._id.toString()) {
            return true;
        }
    });

    if (itemExist) {
        return next(new ErrorHandler("Course already in playlist", 400));
    }

    user.playlist.push({
        course: course._id,
        poster: course.poster.url,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Added to playlist successfully",
    });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id);

    if (!course) {
        return next(
            new ErrorHandler(" Invalid Course ID. Course not found", 404)
        );
    }

    const itemExist = user.playlist.find(
        (item) => item.course.toString() === course._id.toString()
    );

    if (!itemExist) {
        return next(new ErrorHandler("Course not in playlist", 400));
    }

    const newPlaylist = user.playlist.filter(
        (item) => item.course.toString() !== course._id.toString()
    );

    user.playlist = newPlaylist;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Removed from playlist successfully",
    });
});

// Admin Controllers ----> Get All Users

export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find({});

    res.status(200).json({
        success: true,
        message: "Get All Users successfully",
        users,
    });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user.role === "user") {
        user.role = "admin";
    } else {
        user.role = "user";
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: `${user.name} role updated successfully`,
    });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    await cloudinary.v2.uploader.destroy(user.avatar.public_id, {
        folder: "courses/users",
    });

    await user.deleteOne();

    // Cancel Subscription

    res.status(200).json({
        success: true,
        message: `${user.name} Deleted successfully`,
    });
});

User.watch().on("change", async () => {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

    const subscription = await User.find({ "subscription.stats": "active" });

    stats[0].users = await User.countDocuments();

    stats[0].subscription = subscription.length;

    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});
