import { body, ValidationChain } from 'express-validator';
import { Condition, ListingCategory } from '@prisma/client';

export const createListingValidation: ValidationChain[] = [
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

    body('condition')
        .notEmpty()
        .withMessage('Condition is required')
        .isIn(Object.values(Condition))
        .withMessage('Invalid condition value'),

    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(Object.values(ListingCategory))
        .withMessage('Invalid category value'),

    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),

    body('isRentable')
        .optional()
        .isBoolean()
        .withMessage('isRentable must be a boolean'),

    body('rentalPeriod')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Rental period must be a positive integer')
        .custom((value, { req }) => {
            if (req.body.isRentable && !value) {
                throw new Error('Rental period is required when listing is rentable');
            }
            return true;
        }),
];
