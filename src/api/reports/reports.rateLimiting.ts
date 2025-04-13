import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Rate limit for creating reports: 5 per 15 minutes
export const createReportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many reports created. Please try again later."));
    }
});

// Rate limit for retrieving reports: 50 per 15 minutes
export const getReportsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many report requests. Please try again later."));
    }
});

// Rate limit for deleting reports: 10 per 15 minutes
export const deleteReportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many deletion attempts. Please try again later."));
    }
});

// Rate limit for admin actions: 100 per 15 minutes
export const adminReportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many admin requests. Please try again later."));
    }
});
