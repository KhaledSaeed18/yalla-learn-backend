import { body, query } from 'express-validator';
import { JobType, JobStatus, ApplicationStatus } from '@prisma/client';

// Job validation
export const createJobValidation = [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('location').trim().notEmpty().withMessage('Job location is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('requirements').trim().notEmpty().withMessage('Job requirements are required'),
    body('salary').optional().trim(),
    body('type').isIn(Object.values(JobType)).withMessage('Invalid job type'),
    body('status')
        .optional()
        .isIn(Object.values(JobStatus))
        .withMessage('Invalid job status'),
    body('applicationUrl').optional().trim().isURL().withMessage('Invalid URL'),
    body('deadline').optional().isISO8601().toDate().withMessage('Invalid date format')
];

export const updateJobValidation = [
    body('title').optional().trim().notEmpty().withMessage('Job title cannot be empty'),
    body('company').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('location').optional().trim().notEmpty().withMessage('Job location cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Job description cannot be empty'),
    body('requirements').optional().trim().notEmpty().withMessage('Job requirements cannot be empty'),
    body('salary').optional().trim(),
    body('type')
        .optional()
        .isIn(Object.values(JobType))
        .withMessage('Invalid job type'),
    body('status')
        .optional()
        .isIn(Object.values(JobStatus))
        .withMessage('Invalid job status'),
    body('applicationUrl').optional().trim().isURL().withMessage('Invalid URL'),
    body('deadline').optional().isISO8601().toDate().withMessage('Invalid date format')
];

export const validateGetJobsQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
    query('type').optional().isIn(Object.values(JobType)).withMessage('Invalid job type'),
    query('sortBy').optional().isString().withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Job application validation
export const createApplicationValidation = [
    body('coverLetter').optional().trim(),
    body('resume').optional().trim()
];

export const updateApplicationStatusValidation = [
    body('status')
        .isIn(Object.values(ApplicationStatus))
        .withMessage('Invalid application status')
];
