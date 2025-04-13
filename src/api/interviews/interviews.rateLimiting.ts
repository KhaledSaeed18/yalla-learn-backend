import rateLimit from "express-rate-limit";

// Rate limit for creating new interviews
export const createInterviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 interviews per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "You've created too many interviews recently. Please try again later."
    }
});

// Rate limit for continuing interviews
export const continueInterviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 responses per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many interview responses. Please slow down and try again later."
    }
});

// Rate limit for completing interviews
export const completeInterviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 completions per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "You've completed too many interviews recently. Please try again later."
    }
});

// Rate limit for fetching interview history
export const interviewHistoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many history requests. Please try again later."
    }
});
