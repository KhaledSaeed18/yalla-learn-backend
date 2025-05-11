import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Rate limiting for profile endpoints
export const profileGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many profile retrieval attempts, please try again later"));
    }
});

export const profileUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many profile update attempts, please try again later"));
    }
});

export const profileDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many account deletion attempts, please try again later"));
    }
});

export const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many password change attempts, please try again later"));
    }
});

// Rate limiting for admin user management endpoints
export const adminUsersGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many user listing attempts, please try again later"));
    }
});

export const adminUserDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many user deletion attempts, please try again later"));
    }
});

export const adminUserAnalyticsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per 15 minutes
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many analytics retrieval attempts, please try again later"));
    }
});