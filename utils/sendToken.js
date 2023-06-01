export const sendToken = (res, user, message, statusCode = 200) => {
    const token = user.getJWTToken();

    const options = {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,

        // Don't add secure while in Localhost mode. It wont save the cookie in browser if secure is true.

        secure: true,

        sameSite: "none",
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        message,
    });
};
