import rateLimit from 'express-rate-limit';
import { errorHandler } from '../../utils/errorHandler';

// Rate limiting for signup attempts, 5 attempts per 15 minutes
export const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res, next) => {
        next(errorHandler(429, "Too many signup attempts, please try again later"));
    }
});

// Rate limiting for signin attempts, 5 attempts per 15 minutes
export const signinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res, next) => {
        next(errorHandler(429, "Too many signin attempts, please try again later"));
    }
});
