import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorHandler } from "../../utils/errorHandler";

// Validate chat completion request
export const validateChatCompletion = [
    body("messages").isArray({ min: 1 }).withMessage("Messages must be an array with at least one message"),
    body("messages.*.role").isIn(["user", "assistant"]).withMessage("Message role must be 'user' or 'assistant'"),
    body("messages.*.content").isString().notEmpty().withMessage("Message content is required"),
    body("maxTokens").optional().isInt({ min: 1, max: 4096 }).withMessage("Max tokens must be between 1 and 4096"),
    body("temperature").optional().isFloat({ min: 0, max: 1 }).withMessage("Temperature must be between 0 and 1"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

// Validate conversation history request
export const validateConversationHistory = [
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

export const validateContinueConversation = [
    body("conversationId").isUUID().withMessage("Valid conversation ID is required"),
    body("message").isString().notEmpty().withMessage("Message content is required"),
    body("maxTokens").optional().isInt({ min: 1, max: 4096 }).withMessage("Max tokens must be between 1 and 4096"),
    body("temperature").optional().isFloat({ min: 0, max: 1 }).withMessage("Temperature must be between 0 and 1"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];