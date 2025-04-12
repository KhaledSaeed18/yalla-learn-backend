import rateLimit from 'express-rate-limit';

// Rate limit for retrieving chat history
export const chatHistoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many chat history requests, please try again later."
    }
});

// Rate limit for retrieving messages in a conversation
export const messagesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // 150 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many message requests, please try again later."
    }
});

// Rate limit for creating new conversations
export const createConversationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        statusCode: 429,
        message: "Too many conversation creation requests, please try again later."
    }
});