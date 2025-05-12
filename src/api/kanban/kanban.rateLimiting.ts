import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Board rate limiters
export const boardCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many board creation attempts, please try again later"));
    }
});

export const boardGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many board retrieval attempts, please try again later"));
    }
});

export const boardDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many board deletion attempts, please try again later"));
    }
});

// Column rate limiters
export const columnCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many column creation attempts, please try again later"));
    }
});

export const columnDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many column deletion attempts, please try again later"));
    }
});

// Task rate limiters
export const taskCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many task creation attempts, please try again later"));
    }
});

export const taskGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // 200 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many task retrieval attempts, please try again later"));
    }
});

export const taskDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many task deletion attempts, please try again later"));
    }
});