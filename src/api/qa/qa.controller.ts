import { Request, Response, NextFunction } from "express";
import { QAService } from "./qa.service";
import { errorHandler } from "../../utils/errorHandler";

export default class QAController {
    private qaService: QAService;

    constructor() {
        this.qaService = new QAService();
        this.createTag = this.createTag.bind(this);
        this.getTags = this.getTags.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
    }

    // Create a new tag (admin only)
    async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name } = req.body;

            const tag = await this.qaService.createTag(name);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Tag created successfully",
                data: { tag }
            });
        } catch (err) {
            if ((err as Error).message === "Tag with this name already exists") {
                next(errorHandler(409, "Tag with this name already exists"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create tag"));
        }
    }

    // Get all tags
    async getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tags = await this.qaService.getTags();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Tags retrieved successfully",
                data: { tags }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve tags"));
        }
    }

    // Delete a tag (admin only)
    async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            await this.qaService.deleteTag(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Tag deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Tag not found") {
                next(errorHandler(404, "Tag not found"));
                return;
            }
            if ((err as Error).message === "Cannot delete tag that is associated with questions") {
                next(errorHandler(400, "Cannot delete tag that is associated with questions"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete tag"));
        }
    }
}