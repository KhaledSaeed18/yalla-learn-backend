import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Rate limiting for question operations
export const questionCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many question creation attempts, please try again later"));
    }
});

export const questionGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // 200 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many question retrieval attempts, please try again later"));
    }
});

export const questionUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many question update attempts, please try again later"));
    }
});

export const questionDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many question deletion attempts, please try again later"));
    }
});

// Rate limiting for answer operations
export const answerCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many answer creation attempts, please try again later"));
    }
});

export const answerUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many answer update attempts, please try again later"));
    }
});

export const answerDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many answer deletion attempts, please try again later"));
    }
});

// Rate limiting for comment operations
export const commentCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many comment creation attempts, please try again later"));
    }
});

export const commentDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many comment deletion attempts, please try again later"));
    }
});

// Rate limiting for voting operations
export const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many voting attempts, please try again later"));
    }
});

// Rate limiting for tag operations
export const tagCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many tag creation attempts, please try again later"));
    }
});

// Rate limiting for accept answer operation
export const acceptAnswerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many accept answer attempts, please try again later"));
    }
});