import rateLimit from "express-rate-limit";

// Rate limit for chat completion endpoint
export const chatCompletionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many chat completion requests, please try again later."
    }
});

// Rate limit for getting conversation history
export const chatHistoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many history requests, please try again later."
    }
});

// Rate limit for continuing conversations
export const continueChatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many conversation continuation requests, please try again later."
    }
});