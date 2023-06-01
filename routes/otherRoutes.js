import express from "express";
import {
    contact,
    courseRequest,
    getDashboardStats,
} from "../controllers/otherController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Contact form =========>
router.route("/contact").post(contact);

// Request course form  ========>
router.route("/courserequest").post(courseRequest);

// Get Admin Dashboard stats ========>
router
    .route("/admin/stats")
    .get(isAuthenticated, authorizedAdmin, getDashboardStats);

//
export default router;
