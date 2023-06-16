import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";

// <================================ X X X =================================>

export const buySubscription = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (user.role === "admin") {
        return next(new ErrorHandler("Admin cannot buy subscription", 400));
    }

    const Plan_Id = process.env.PLAN_ID || "plan_LuybgFjhU8b0dE";

    const subscription = await instance.subscriptions.create({
        plan_id: Plan_Id,
        customer_notify: 1,

        total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Subscription purchased successfully",
        subscriptionId: subscription.id,
    });
});

export const paymentVarification = catchAsyncError(async (req, res, next) => {
    const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
    } = req.body;

    const user = await User.findById(req.user._id);

    const subscription_id = user.subscription.id;

    const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
        .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
        .digest("hex");

    const isAuthenti = generated_signature === razorpay_signature;

    if (!isAuthenti) {
        // return next(new ErrorHandler("Payment failed", 400));
        return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);
    }

    // Database comes here

    await Payment.create({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
    });

    user.subscription.status = "active";

    await user.save();

    res.redirect(
        `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
    );
});

export const getRazorpayKey = catchAsyncError(async (req, res, next) => {
    res.status(200).json({
        success: true,
        key: process.env.RAZORPAY_API_KEY,
    });
});

export const cancleSubscription = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    const subscriptionId = user.subscription.id;

    let refund = false;

    await instance.subscriptions.cancel(subscriptionId);

    const payment = await Payment.findOne({
        razorpay_subscription_id: subscriptionId,
    });

    const gap = Date.now() - payment.createdAt;

    const refundTime = process.env.REFUND_TIME * 24 * 60 * 60 * 1000;

    if (refundTime > gap) {
        await instance.payments.refund(payment.razorpay_payment_id);
        refund = true;
    }

    await payment.deleteOne();

    user.subscription.id = undefined;
    user.subscription.status = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: refund
            ? "Subscription canceled successfully. Refund will be made within 7 days."
            : "Subscription canceled successfully. No refund will be made as subscription is cancelled after 7 days.",
    });
});
