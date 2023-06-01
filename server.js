// Remember to add ".js" whille importing the file. Otherwise it will show error.
import app from "./app.js";
import { connnectDB } from "./config/database.js";

import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import nodeCorn from "node-cron";
import { Stats } from "./models/AdminStats.js";

connnectDB();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
});

nodeCorn.schedule("0 0 0 1 * *", async () => {
    try {
        await Stats.create({});
    } catch (error) {
        console.log(error);
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is working on port: ${process.env.PORT}`);
});
