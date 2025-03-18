import { Request, Response, NextFunction } from "express";
import { BlogService, BlogQueryOptions } from "./blog.service";
import { errorHandler } from "../../utils/errorHandler";
import { BlogStatus } from "@prisma/client";

export default class BlogController {
    private blogService: BlogService;

    constructor() {
        this.blogService = new BlogService();
        this.createCategory = this.createCategory.bind(this);
        this.getCategories = this.getCategories.bind(this);
        this.getCategoryById = this.getCategoryById.bind(this);
        this.createBlogPost = this.createBlogPost.bind(this);
        this.getBlogPosts = this.getBlogPosts.bind(this);
        this.getBlogPostByIdOrSlug = this.getBlogPostByIdOrSlug.bind(this);
    }

    // Create a new blog category
    async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, slug, description } = req.body;

            const category = await this.blogService.createCategory(name, slug, description);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Category created successfully",
                data: { category }
            });
        } catch (err) {
            if ((err as Error).message === "Category with this slug already exists") {
                next(errorHandler(409, "Category with this slug already exists"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create category"));
        }
    }

    // Get all categories
    async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await this.blogService.getCategories();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Categories retrieved successfully",
                data: { categories }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve categories"));
        }
    }

    // Get a category by id
    async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const category = await this.blogService.getCategoryById(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Category retrieved successfully",
                data: { category }
            });
        } catch (err) {
            if ((err as Error).message === "Category not found") {
                next(errorHandler(404, "Category not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve category"));
        }
    }

    // Create a new blog post
    async createBlogPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                title,
                slug,
                content,
                excerpt,
                thumbnail,
                status,
                readTime,
                publishedAt,
                categoryIds
            } = req.body;

            // Get user ID from authorized request
            const userId = req.user?.userId;

            if (!userId) {
                next(errorHandler(401, "Unauthorized - User ID not found"));
                return;
            }

            const blogPost = await this.blogService.createBlogPost(
                userId,
                title,
                slug,
                content,
                categoryIds,
                excerpt,
                thumbnail,
                status as BlogStatus,
                readTime,
                publishedAt
            );

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Blog post created successfully",
                data: { blogPost }
            });
        } catch (err) {
            if ((err as Error).message === "Blog post with this slug already exists") {
                next(errorHandler(409, "Blog post with this slug already exists"));
                return;
            }
            if ((err as Error).message === "One or more categories not found") {
                next(errorHandler(404, "One or more categories not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create blog post"));
        }
    }

    // Get blog posts with filtering and pagination
    async getBlogPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Extract query parameters
            const {
                page,
                limit,
                status,
                categoryId,
                search,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                status?: string;
                categoryId?: string;
                search?: string;
                sortBy?: string;
                sortOrder?: string;
            };

            // Build options object
            const options: BlogQueryOptions = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status: status as BlogStatus | undefined,
                categoryId,
                search,
                sortBy,
                sortOrder: sortOrder as 'asc' | 'desc' | undefined
            };

            const result = await this.blogService.getBlogPosts(options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Blog posts retrieved successfully",
                data: {
                    posts: result.posts,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve blog posts"));
        }
    }

    // Get a blog post by ID or slug
    async getBlogPostByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idOrSlug } = req.params;
            const post = await this.blogService.getBlogPostByIdOrSlug(idOrSlug);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Blog post retrieved successfully",
                data: { post }
            });
        } catch (err) {
            if ((err as Error).message === "Blog post not found") {
                next(errorHandler(404, "Blog post not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve blog post"));
        }
    }
}