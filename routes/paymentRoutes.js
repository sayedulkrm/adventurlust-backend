import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    buySubscription,
    cancleSubscription,
    getRazorpayKey,
    paymentVarification,
} from "../controllers/paymentController.js";

const router = express.Router();

// Buy Subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

// Payment Varification and Save Reference in Database --> Payment
router.route("/paymentverification").post(isAuthenticated, paymentVarification);

// API KEY Varification
router.route("/razorpaykey").get(getRazorpayKey);

// cancel Subscription
router.route("/subscribe/cancel").delete(isAuthenticated, cancleSubscription);

//
export default router;
