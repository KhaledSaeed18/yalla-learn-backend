import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

export const createListingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many listing creation attempts, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const listingGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many listing retrieval attempts, please try again later"));
    }
});

export const listingAdminGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many admin listing retrieval attempts, please try again later"));
    }
});

export const listingUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many listing update attempts, please try again later"));
    }
});

export const listingDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many listing deletion attempts, please try again later"));
    }
});
