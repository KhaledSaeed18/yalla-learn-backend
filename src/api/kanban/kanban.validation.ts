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
        .withMessage('Due date must be a valid date in ISO format')
];

export const taskIdValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid task ID format')
];

// Move task validation
export const moveTaskValidation = [
    param('taskId')
        .isUUID()
        .withMessage('Invalid task ID format'),
    body('columnId')
        .isUUID()
        .withMessage('Invalid target column ID format')
];