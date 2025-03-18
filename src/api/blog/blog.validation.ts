import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';
import { BlogStatus } from '@prisma/client';

// Blog Category schema
const categorySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Category name is required and must be at least 2 characters")
        .max(50, "Category name cannot exceed 50 characters"),

    slug: z.string()
        .trim()
        .min(2, "Slug is required and must be at least 2 characters")
        .max(100, "Slug cannot exceed 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

    description: z.string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .nullable(),
});

// Blog Post schema
const blogPostSchema = z.object({
    title: z.string()
        .trim()
        .min(5, "Title is required and must be at least 5 characters")
        .max(255, "Title cannot exceed 255 characters"),

    slug: z.string()
        .trim()
        .min(5, "Slug is required and must be at least 5 characters")
        .max(200, "Slug cannot exceed 200 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

    content: z.string()
        .trim()
        .min(10, "Content is required and must be at least 10 characters"),

    excerpt: z.string()
        .trim()
        .max(300, "Excerpt cannot exceed 300 characters")
        .optional()
        .nullable(),

    thumbnail: z.string()
        .trim()
        .url("Thumbnail must be a valid URL")
        .optional()
        .nullable(),

    status: z.nativeEnum(BlogStatus)
        .default(BlogStatus.DRAFT),

    readTime: z.number()
        .positive("Read time must be positive")
        .optional()
        .nullable(),

    publishedAt: z.string()
        .datetime("Published date must be a valid ISO datetime")
        .optional()
        .nullable(),

    categoryIds: z.array(z.string())
        .optional()
        .default([]),
});

// Get blog query params schema
const getBlogQuerySchema = z.object({
    page: z.string()
        .transform(val => parseInt(val) || 1)
        .refine(val => val > 0, { message: "Page must be a positive number" })
        .optional(),

    limit: z.string()
        .transform(val => parseInt(val) || 10)
        .refine(val => val > 0 && val <= 100, { message: "Limit must be between 1 and 100" })
        .optional(),

    status: z.nativeEnum(BlogStatus).optional(),

    categoryId: z.string().optional(),

    search: z.string().optional(),

    sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title']).optional(),

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

export const validateCategoryCreate = validate(categorySchema);
export const validateBlogPostCreate = validate(blogPostSchema);
export const validateGetBlogQuery = validateQuery(getBlogQuerySchema);