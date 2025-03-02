import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';

const BLOCKED_DOMAINS = ['test.com', 'example.com'];

// Signup schema
const signupSchema = z.object({
    firstName: z.string()
        .trim()
        .min(1, "First name is required")
        .max(50, "First name cannot exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),

    lastName: z.string()
        .trim()
        .min(1, "Last name is required")
        .max(50, "Last name cannot exceed 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),

    email: z.string()
        .trim()
        .email("Invalid email format")
        .refine(email => {
            const domain = email.split('@')[1];
            return !BLOCKED_DOMAINS.includes(domain.toLowerCase());
        }, "This email domain is not allowed. Please use a different email address"),

    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password cannot exceed 64 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

// Signin schema
const signinSchema = z.object({
    email: z.string()
        .trim()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),

    password: z.string()
        .min(1, "Password is required")
        .max(64, "Password exceeds maximum length")
});

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            const errorMessage = "Validation failed. Please check your input.";
            return next(errorHandler(400, errorMessage, { validationErrors }));
        }
        next(errorHandler(400, "Invalid request data"));
    }
};

export const validateSignup = validate(signupSchema);
export const validateSignin = validate(signinSchema);