/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import ReportService from './reports.service';
import { errorHandler } from '../../utils/errorHandler';

export default class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    // Format consistent API response
    private formatResponse(statusCode: number, message: string, data: any = null) {
        return {
            status: statusCode >= 200 && statusCode < 300 ? "success" : "error",
            statusCode,
            message,
            data
        };
    }

    // Create a new campus report
    async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            const report = await this.reportService.createReport(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Campus issue reported successfully",
                { report }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create report"));
        }
    }

    // Get reports (filtered by user if not admin)
    async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            const isAdmin = req.user.role === 'ADMIN';
            const userId = !isAdmin ? req.user.userId : undefined;

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

            const result = await this.reportService.getReports({
                userId,
                isAdmin,
                page,
                limit,
                status: req.query.status as any,
                isEmergency: req.query.isEmergency === 'true' ? true :
                    (req.query.isEmergency === 'false' ? false : undefined)
            });

            res.status(200).json(this.formatResponse(
                200,
                "Reports retrieved successfully",
                result
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve reports"));
        }
    }

    // Get a specific report by ID
    async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            const { id } = req.params;
            const isAdmin = req.user.role === 'ADMIN';

            const report = await this.reportService.getReportById(id, req.user.userId, isAdmin);

            res.status(200).json(this.formatResponse(
                200,
                "Report retrieved successfully",
                { report }
            ));
        } catch (err) {
            if ((err as Error).message === "Report not found") {
                next(errorHandler(404, "Report not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve report"));
        }
    }

    // Delete a report
    async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            const { id } = req.params;
            const isAdmin = req.user.role === 'ADMIN';

            await this.reportService.deleteReport(id, req.user.userId, isAdmin);

            res.status(200).json(this.formatResponse(
                200,
                "Report deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Report not found") {
                next(errorHandler(404, "Report not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete report"));
        }
    }

    // Update report status (admin only)
    async updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            if (req.user.role !== 'ADMIN') {
                return next(errorHandler(403, "Unauthorized - Admin access required"));
            }

            const { id } = req.params;
            const { status } = req.body;

            const report = await this.reportService.updateReportStatus(id, status);

            res.status(200).json(this.formatResponse(
                200,
                "Report status updated successfully",
                { report }
            ));
        } catch (err) {
            if ((err as Error).message === "Report not found") {
                next(errorHandler(404, "Report not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update report status"));
        }
    }
}
