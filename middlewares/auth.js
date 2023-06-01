import JWT from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(
            new ErrorHandler("Please Login to access this resource", 401)
        );
    }

    const decodedData = JWT.verify(token, process.env.JWT_SECRET);

    // req.user = await User.findById(decodedData.id);
    req.user = await User.findById(decodedData._id);

    next();
});

export const authorizedAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return next(
            new ErrorHandler(
                "You are not authorized to access this resource",
                403
            )
        );
    }

    next();
};

export const authorizedSubscribers = (req, res, next) => {
    if (
        req.user.subscription.status !== "active" &&
        req.user.role !== "admin"
    ) {
        return next(
            new ErrorHandler("Only subscriber can access this resource", 403)
        );
    }

    next();
};
