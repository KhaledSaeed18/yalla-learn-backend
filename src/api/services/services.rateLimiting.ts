import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

export const createServiceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many service creation attempts, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const serviceGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many service retrieval attempts, please try again later"));
    }
});

export const serviceAdminGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many admin service retrieval attempts, please try again later"));
    }
});

export const serviceUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many service update attempts, please try again later"));
    }
});

export const serviceDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (_req, _res, next) => {
        next(errorHandler(429, "Too many service deletion attempts, please try again later"));
    }
});
