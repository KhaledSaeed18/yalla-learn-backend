import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';
import { QuestionStatus, VoteType } from '@prisma/client';

// Question creation schema
const questionSchema = z.object({
    title: z.string()
        .trim()
        .min(5, "Title is required and must be at least 5 characters")
        .max(255, "Title cannot exceed 255 characters"),

    content: z.string()
        .trim()
        .min(20, "Content is required and must be at least 20 characters"),

    tags: z.array(z.string())
        .optional()
        .default([]),
});

// Answer creation schema
const answerSchema = z.object({
    content: z.string()
        .trim()
        .min(20, "Answer content is required and must be at least 20 characters"),

    questionId: z.string()
        .trim()
        .min(1, "Question ID is required"),
});

// Comment creation schema for questions
const questionCommentSchema = z.object({
    content: z.string()
        .trim()
        .min(3, "Comment content is required and must be at least 3 characters")
        .max(500, "Comment cannot exceed 500 characters"),

    questionId: z.string()
        .trim()
        .min(1, "Question ID is required"),
});

// Comment creation schema for answers
const answerCommentSchema = z.object({
    content: z.string()
        .trim()
        .min(3, "Comment content is required and must be at least 3 characters")
        .max(500, "Comment cannot exceed 500 characters"),

    answerId: z.string()
        .trim()
        .min(1, "Answer ID is required"),
});

// Vote schema for questions
const questionVoteSchema = z.object({
    questionId: z.string()
        .trim()
        .min(1, "Question ID is required"),

    type: z.nativeEnum(VoteType),
});

// Vote schema for answers
const answerVoteSchema = z.object({
    answerId: z.string()
        .trim()
        .min(1, "Answer ID is required"),

    type: z.nativeEnum(VoteType),
});

// Tag creation schema
const tagSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Tag name is required and must be at least 2 characters")
        .max(30, "Tag name cannot exceed 30 characters")
        .regex(/^[a-z0-9-]+$/, "Tag can only contain lowercase letters, numbers, and hyphens"),
});

// Accept answer schema
const acceptAnswerSchema = z.object({
    questionId: z.string()
        .trim()
        .min(1, "Question ID is required"),

    answerId: z.string()
        .trim()
        .min(1, "Answer ID is required"),
});

// Update question schema
const updateQuestionSchema = z.object({
    title: z.string()
        .trim()
        .min(5, "Title is required and must be at least 5 characters")
        .max(255, "Title cannot exceed 255 characters")
        .optional(),

    content: z.string()
        .trim()
        .min(20, "Content is required and must be at least 20 characters")
        .optional(),

    status: z.nativeEnum(QuestionStatus)
        .optional(),

    tags: z.array(z.string())
        .optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

// Update answer schema
const updateAnswerSchema = z.object({
    content: z.string()
        .trim()
        .min(20, "Content is required and must be at least 20 characters"),
});

// Get questions query params schema
const getQuestionsQuerySchema = z.object({
    page: z.string()
        .transform(val => parseInt(val) || 1)
        .refine(val => val > 0, { message: "Page must be a positive number" })
        .optional(),

    limit: z.string()
        .transform(val => parseInt(val) || 10)
        .refine(val => val > 0 && val <= 50, { message: "Limit must be between 1 and 50" })
        .optional(),

    status: z.nativeEnum(QuestionStatus).optional(),

    tagId: z.string().optional(),

    userId: z.string().optional(),

    search: z.string().optional(),

    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),

    sortOrder: z.enum(['asc', 'desc']).optional(),
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

export const validateQuestionCreate = validate(questionSchema);
export const validateAnswerCreate = validate(answerSchema);
export const validateQuestionCommentCreate = validate(questionCommentSchema);
export const validateAnswerCommentCreate = validate(answerCommentSchema);
export const validateQuestionVote = validate(questionVoteSchema);
export const validateAnswerVote = validate(answerVoteSchema);
export const validateTagCreate = validate(tagSchema);
export const validateAcceptAnswer = validate(acceptAnswerSchema);
export const validateUpdateQuestion = validate(updateQuestionSchema);
export const validateUpdateAnswer = validate(updateAnswerSchema);
export const validateGetQuestionsQuery = validateQuery(getQuestionsQuerySchema);