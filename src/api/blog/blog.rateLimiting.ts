import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Rate limiting for blog category endpoints
export const categoryCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many category creation attempts, please try again later"));
    }
});

export const categoryGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many category retrieval attempts, please try again later"));
    }
});

// Rate limiting for blog post endpoints
export const postCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many post creation attempts, please try again later"));
    }
});

export const postGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // 200 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many post retrieval attempts, please try again later"));
    }
});