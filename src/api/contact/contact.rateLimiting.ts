import rateLimit from "express-rate-limit";

export const contactRateLimiter = {
    // Limit contact form submissions to 5 per hour from the same IP
    createContactForm: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5,
        message: {
            status: "error",
            statusCode: 429,
            message: "Too many contact form submissions, please try again later."
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
};
