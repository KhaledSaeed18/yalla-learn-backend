import express, { Router } from "express";
import { ContactController } from "./contact.controller";
import { contactRateLimiter } from "./contact.rateLimiting";
import { authorizeAdmin } from "../../middlewares/authorization.middleware";

export default class ContactRouter {
    private router: Router;
    private contactController: ContactController;

    constructor() {
        this.router = express.Router();
        this.contactController = new ContactController();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Create contact form (Public)
        this.router.post(
            "/create",
            contactRateLimiter.createContactForm,
            this.contactController.createContactForm.bind(this.contactController)
        );

        // Get all contact forms (Admin only)
        this.router.get(
            "/get-all",
            authorizeAdmin,
            this.contactController.getAllContactForms.bind(this.contactController)
        );

        // Get contact form by ID (Admin only)
        this.router.get(
            "/get/:id",
            authorizeAdmin,
            this.contactController.getContactFormById.bind(this.contactController)
        );

        // Delete contact form (Admin only)
        this.router.delete(
            "/delete/:id",
            authorizeAdmin,
            this.contactController.deleteContactForm.bind(this.contactController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
