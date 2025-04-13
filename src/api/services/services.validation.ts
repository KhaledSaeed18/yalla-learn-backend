import { body, ValidationChain } from 'express-validator';
import { GigCategory, ServiceDirection } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';
import { z } from 'zod';

export const createServiceValidation: ValidationChain[] = [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isString()
        .withMessage('Title must be a string')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),

    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),

    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),

    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(Object.values(GigCategory))
        .withMessage('Invalid category value'),

    body('direction')
        .optional()
        .isIn(Object.values(ServiceDirection))
        .withMessage('Invalid direction value'),
];

export const updateServiceValidation: ValidationChain[] = [
    body('title')
        .optional()
        .isString()
        .withMessage('Title must be a string')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),

    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),

    body('category')
        .optional()
        .isIn(Object.values(GigCategory))
        .withMessage('Invalid category value'),

    body('direction')
        .optional()
        .isIn(Object.values(ServiceDirection))
        .withMessage('Invalid direction value'),
];

// Get services query params schema
const getServicesQuerySchema = z.object({
    page: z.string()
        .transform(val => parseInt(val) || 1)
        .refine(val => val > 0, { message: "Page must be a positive number" })
        .optional(),

    limit: z.string()
        .transform(val => parseInt(val) || 10)
        .refine(val => val > 0 && val <= 50, { message: "Limit must be between 1 and 50" })
        .optional(),

    category: z.nativeEnum(GigCategory).optional(),

    direction: z.nativeEnum(ServiceDirection).optional(),

    sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'title']).optional(),

    sortOrder: z.enum(['asc', 'desc']).optional(),
});

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

export const validateGetServicesQuery = validateQuery(getServicesQuerySchema);
