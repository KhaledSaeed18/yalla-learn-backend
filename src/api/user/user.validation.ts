import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';
import { Role } from '@prisma/client';

// User profile update schema
const userUpdateSchema = z.object({
    firstName: z.string()
        .trim()
        .min(2, "First name is required and must be at least 2 characters")
        .max(50, "First name cannot exceed 50 characters")
        .optional(),

    lastName: z.string()
        .trim()
        .min(2, "Last name is required and must be at least 2 characters")
        .max(50, "Last name cannot exceed 50 characters")
        .optional(),

    bio: z.string()
        .trim()
        .max(500, "Bio cannot exceed 500 characters")
        .optional()
        .nullable(),

    location: z.string()
        .trim()
        .max(100, "Location cannot exceed 100 characters")
        .optional()
        .nullable(),

    phoneNumber: z.string()
        .trim()
        .max(20, "Phone number cannot exceed 20 characters")
        .optional()
        .nullable(),

    avatar: z.string()
        .trim()
        .url("Avatar must be a valid URL")
        .optional()
        .nullable(),
});

// Admin user update schema with additional fields
const adminUserUpdateSchema = userUpdateSchema.extend({
    email: z.string()
        .trim()
        .email("Must be a valid email address")
        .optional(),

    role: z.nativeEnum(Role)
        .optional(),

    isVerified: z.boolean()
        .optional(),
});

// Query parameters for getting users list
const getUsersQuerySchema = z.object({
    page: z.string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 1)),

    limit: z.string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 10)),

    search: z.string()
        .optional(),

    role: z.nativeEnum(Role)
        .optional(),

    isVerified: z.string()
        .optional()
        .transform(val => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        }),

    sortBy: z.string()
        .optional(),

    sortOrder: z.enum(['asc', 'desc'])
        .optional()
        .default('desc'),
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

// Query validation middleware
const validateQuery = <T extends z.ZodSchema>(schema: T) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.query = schema.parse(req.query) as z.infer<T>;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            const errorMessage = "Invalid query parameters";
            return next(errorHandler(400, errorMessage, { validationErrors }));
        }
        next(errorHandler(400, "Invalid query parameters"));
    }
};

export const validateUserUpdate = validate(userUpdateSchema);
export const validateAdminUserUpdate = validate(adminUserUpdateSchema);
export const validateGetUsersQuery = validateQuery(getUsersQuerySchema);