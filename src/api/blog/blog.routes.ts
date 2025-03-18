import { Router } from "express";
import BlogController from "./blog.controller";
import { categoryCreateLimiter, categoryGetLimiter, postCreateLimiter, postGetLimiter } from "./blog.rateLimiting";
import { validateBlogPostCreate, validateCategoryCreate, validateGetBlogQuery } from "./blog.validation";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class BlogRouter {
    private router: Router;
    private blogController: BlogController;

    constructor() {
        this.router = Router();
        this.blogController = new BlogController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Category routes
        this.router.post(
            "/create-category",
            authorize,
            categoryCreateLimiter,
            sanitizeRequestBody,
            validateCategoryCreate,
            this.blogController.createCategory
        );

        this.router.get(
            "/get-categories",
            categoryGetLimiter,
            this.blogController.getCategories
        );

        this.router.get(
            "/get-category/:id",
            categoryGetLimiter,
            this.blogController.getCategoryById
        );

        // Blog post routes
        this.router.post(
            "/create-post",
            authorize,
            postCreateLimiter,
            sanitizeRequestBody,
            validateBlogPostCreate,
            this.blogController.createBlogPost
        );

        this.router.get(
            "/get-posts",
            postGetLimiter,
            validateGetBlogQuery,
            this.blogController.getBlogPosts
        );

        this.router.get(
            "/get-post/:idOrSlug",
            postGetLimiter,
            this.blogController.getBlogPostByIdOrSlug
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}