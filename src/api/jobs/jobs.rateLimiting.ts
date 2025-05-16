import rateLimit from 'express-rate-limit';

// Job-related rate limits
export const jobCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 job creations per hour
    message: 'Too many job creation requests from this IP, please try again after an hour'
});

export const jobGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 job requests per 15 minutes
    message: 'Too many job requests from this IP, please try again after 15 minutes'
});

export const jobUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // limit each IP to 30 job updates per hour
    message: 'Too many job update requests from this IP, please try again after an hour'
});

export const jobDeleteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 job deletions per hour
    message: 'Too many job deletion requests from this IP, please try again after an hour'
});

// Job application-related rate limits
export const applicationCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 job applications per hour
    message: 'Too many job application submissions from this IP, please try again after an hour'
});

export const applicationGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 application requests per 15 minutes
    message: 'Too many application requests from this IP, please try again after 15 minutes'
});
