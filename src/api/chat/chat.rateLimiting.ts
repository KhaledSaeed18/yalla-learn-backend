import rateLimit from 'express-rate-limit';

// Simple rate limiter for all chat endpoints
export const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many requests, please try again later."
    }
});
