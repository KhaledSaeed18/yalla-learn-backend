import { body, param } from 'express-validator';
import { TaskPriority } from '@prisma/client';

// Board validations
export const createBoardValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Board title is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Board title must be between 3 and 50 characters')
];

export const updateBoardValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid board ID format'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Board title cannot be empty')
        .isLength({ min: 3, max: 50 })
        .withMessage('Board title must be between 3 and 50 characters')
];

export const boardIdValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid board ID format')
];

// Column validations
export const createColumnValidation = [
    param('boardId')
        .isUUID()
        .withMessage('Invalid board ID format'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Column title is required')
        .isLength({ min: 1, max: 30 })
        .withMessage('Column title must be between 1 and 30 characters'),
    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean value'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a positive integer')
];

export const updateColumnValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid column ID format'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Column title cannot be empty')
        .isLength({ min: 1, max: 30 })
        .withMessage('Column title must be between 1 and 30 characters'),
    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean value'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a positive integer')
];

export const columnIdValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid column ID format')
];

// Task validations
export const createTaskValidation = [
    param('columnId')
        .isUUID()
        .withMessage('Invalid column ID format'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Task title is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Task title must be between 1 and 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Task description cannot exceed 1000 characters'),
    body('priority')
        .isIn(Object.values(TaskPriority))
        .withMessage('Invalid priority value'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date in ISO format'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isString()
        .isLength({ min: 1, max: 20 })
        .withMessage('Each tag must be between 1 and 20 characters')
];

export const updateTaskValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid task ID format'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Task title cannot be empty')
        .isLength({ min: 1, max: 100 })
        .withMessage('Task title must be between 1 and 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Task description cannot exceed 1000 characters'),
    body('priority')
        .optional()
        .isIn(Object.values(TaskPriority))
        .withMessage('Invalid priority value'),
    body('dueDate')
        .optional()
        .custom((value) => {
            if (value === null) return true;
            if (!value) return true;

            try {
                new Date(value);
                return true;
            } catch (e) {
                console.error('Invalid date format:', e);
                return false;
            }
        })
        .withMessage('Due date must be a valid date, null, or undefined'),
    body('columnId')
        .optional()
        .isUUID()
        .withMessage('Column ID must be a valid UUID'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isString()
        .isLength({ min: 1, max: 20 })
        .withMessage('Each tag must be between 1 and 20 characters')
];

export const taskIdValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid task ID format')
];