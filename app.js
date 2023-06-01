import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({
    path: "./config/config.env",
});

const app = express();

// Importing Middlewars
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
);

// Importing Routes

import course from "./routes/courseRoutes.js";
import user from "./routes/userRoutes.js";
import payment from "./routes/paymentRoutes.js";
import other from "./routes/otherRoutes.js";

app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);

app.get("/", (req, res) => {
    res.send(
        `<h1>Server is Running. Click <a herf="${process.env.FRONTEND_URL}"> here </a> to go to Frontend </h1>`
    );
});

export default app;

// Always use Error Middleware at the end of all function
app.use(ErrorMiddleware);
