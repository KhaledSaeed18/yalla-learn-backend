import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../../utils/errorHandler";
import { PrismaClient } from "@prisma/client";

export class ContactController {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }
    /**
     * Create a new contact form submission
     * @route POST /api/v1/contact
     * @access Public
     */
    async createContactForm(req: Request, res: Response, next: NextFunction) {
        try {
            // Create new contact form submission
            const contactForm = await this.prisma.contactForm.create({
                data: req.body
            });

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Contact form submitted successfully",
                data: {
                    id: contactForm.id
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create contact form"));
        }
    }

    /**
     * Get all contact form submissions
     * @route GET /api/v1/contact
     * @access Admin
     */
    async getAllContactForms(req: Request, res: Response, next: NextFunction) {
        try {
            const contactForms = await this.prisma.contactForm.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
            });

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Contact forms retrieved successfully",
                data: contactForms,
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve contact forms"));
        }
    }

    /**
     * Get contact form by ID
     * @route GET /api/v1/contact/:id
     * @access Admin
     */
    async getContactFormById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Get contact form
            const contactForm = await this.prisma.contactForm.findUnique({
                where: { id }
            });

            if (!contactForm) {
                res.status(404).json({
                    status: "fail",
                    statusCode: 404,
                    message: "Contact form not found"
                });
                return;
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Contact form retrieved successfully",
                data: contactForm
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve contact form"));
        }
    }

    /**
     * Delete contact form by ID
     * @route DELETE /api/v1/contact/:id
     * @access Admin
     */
    async deleteContactForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Check if contact form exists
            const contactForm = await this.prisma.contactForm.findUnique({
                where: { id }
            });

            if (!contactForm) {
                res.status(404).json({
                    status: "fail",
                    statusCode: 404,
                    message: "Contact form not found"
                });
                return;
            }

            // Delete contact form
            await this.prisma.contactForm.delete({
                where: { id }
            });

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Contact form deleted successfully"
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to delete contact form"));
        }
    }
}
