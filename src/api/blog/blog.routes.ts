import { Router } from "express";
import BlogController from "./blog.controller";
import { categoryCreateLimiter, categoryGetLimiter, categoryUpdateLimiter, categoryDeleteLimiter, postCreateLimiter, postGetLimiter, postUpdateLimiter, postDeleteLimiter } from "./blog.rateLimiting";
import { validateBlogPostCreate, validateBlogPostUpdate, validateCategoryCreate, validateCategoryUpdate, validateGetBlogQuery } from "./blog.validation";
import { authorize, authorizeAdmin } from "../../middlewares/authorization.middleware";
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
            authorizeAdmin,
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

        this.router.put(
            "/update-category/:id",
            authorize,
            authorizeAdmin,
            categoryUpdateLimiter,
            sanitizeRequestBody,
            validateCategoryUpdate,
            this.blogController.updateCategory
        );

        this.router.delete(
            "/delete-category/:id",
            authorize,
            authorizeAdmin,
            categoryDeleteLimiter,
            this.blogController.deleteCategory
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
            "/get-user-blogs",
            authorize,
            postGetLimiter,
            validateGetBlogQuery,
            this.blogController.getUserBlogPosts
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

        this.router.put(
            "/update-post/:id",
            authorize,
            postUpdateLimiter,
            sanitizeRequestBody,
            validateBlogPostUpdate,
            this.blogController.updateBlogPost
        );

        this.router.delete(
            "/delete-post/:id",
            authorize,
            postDeleteLimiter,
            this.blogController.deleteBlogPost
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}