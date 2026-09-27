export const sendToken =(user, statusCode, message, res)=>{
    const token = user.generateToken();
    res.status(statusCode).cookie("token", token, {
        expires: new Date(
             Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/",
        ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
    })
    .json({
        success : true,
        user,
        message,
        token,
    });
}