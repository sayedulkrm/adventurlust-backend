import express from "express";
import {
    addLectures,
    createCourse,
    deleteCourse,
    deleteLecture,
    getAllCourses,
    getCourseLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {
    authorizedAdmin,
    authorizedSubscribers,
    isAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// Get All Courses without Lectures
router.route("/courses").get(getAllCourses);

// Create New course --- ADMIN
router
    .route("/createcourse")
    .post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);

// <------------------------ Lectures Routes -------------------------------->

// Get All Lectures

router
    .route("/course/:id")
    .get(isAuthenticated, authorizedSubscribers, getCourseLectures)
    .post(isAuthenticated, authorizedAdmin, singleUpload, addLectures)
    .delete(isAuthenticated, authorizedAdmin, deleteCourse);

// Delete Lectur

router
    .route("/lecture")
    .delete(isAuthenticated, authorizedAdmin, deleteLecture);

export default router;
