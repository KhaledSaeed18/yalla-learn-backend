import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Standard rate limit for expense tracker API: 100 requests per 15 minutes
export const standardExpenseTrackerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many requests, please try again later"));
    }
});

// Rate limit for creation operations: 30 requests per 15 minutes
export const createExpenseTrackerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many creation requests, please try again later"));
    }
});

// Rate limit for update/delete operations: 50 requests per 15 minutes
export const modifyExpenseTrackerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many modification requests, please try again later"));
    }
});

// Rate limit for report generation: 20 requests per 15 minutes
export const reportExpenseTrackerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many report requests, please try again later"));
    }
});
