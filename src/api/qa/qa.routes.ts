import { Router } from "express";
import QAController from "./qa.controller";
import { tagCreateLimiter, tagDeleteLimiter } from "./qa.rateLimiting";
import { validateTagCreate } from "./qa.validation";
import { authorize, authorizeAdmin } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class QARouter {
    private router: Router;
    private qaController: QAController;

    constructor() {
        this.router = Router();
        this.qaController = new QAController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Tag routes
        // Create tag (admin only)
        this.router.post(
            "/tags",
            authorize,
            authorizeAdmin,
            tagCreateLimiter,
            sanitizeRequestBody,
            validateTagCreate,
            this.qaController.createTag
        );

        // Get all tags
        this.router.get(
            "/tags",
            this.qaController.getTags
        );

        // Delete tag (admin only)
        this.router.delete(
            "/tags/:id",
            authorize,
            authorizeAdmin,
            tagDeleteLimiter,
            this.qaController.deleteTag
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}