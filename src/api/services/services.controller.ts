import { Request, Response, NextFunction } from 'express';
import { ServiceGigService } from './services.service';
import { errorHandler } from '../../utils/errorHandler';
import { GigCategory, ServiceDirection } from '@prisma/client';

export class ServiceController {
    private serviceGigService: ServiceGigService;

    constructor() {
        this.serviceGigService = new ServiceGigService();
        this.createService = this.createService.bind(this);
        this.getServiceById = this.getServiceById.bind(this);
        this.getAllServices = this.getAllServices.bind(this);
        this.getUserServices = this.getUserServices.bind(this);
        this.updateService = this.updateService.bind(this);
        this.deleteService = this.deleteService.bind(this);
        this.adminDeleteService = this.adminDeleteService.bind(this);
        this.getServiceStatistics = this.getServiceStatistics.bind(this);
    }

    createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, 'Authentication required'));
            }

            const service = await this.serviceGigService.createService(req.user.id, req.body);

            res.status(201).json({
                success: true,
                data: service,
            });
        } catch (error) {
            next(error);
        }
    };

    getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const service = await this.serviceGigService.getServiceById(id);

            if (!service) {
                return next(errorHandler(404, 'Service not found'));
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Service retrieved successfully",
                data: { service }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve service"));
        }
    };

    getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {
                page,
                limit,
                category,
                direction,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                category?: GigCategory;
                direction?: ServiceDirection;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                category,
                direction,
                sortBy,
                sortOrder
            };

            const result = await this.serviceGigService.getAllServices(options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Services retrieved successfully",
                data: {
                    services: result.services,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve services"));
        }
    };

    getUserServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;

            const {
                page,
                limit,
                category,
                direction,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                category?: GigCategory;
                direction?: ServiceDirection;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                category,
                direction,
                sortBy,
                sortOrder
            };

            const result = await this.serviceGigService.getUserServices(userId, options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User services retrieved successfully",
                data: {
                    services: result.services,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve user services"));
        }
    };

    updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;
            const { id } = req.params;

            const updatedService = await this.serviceGigService.updateService(id, userId, req.body);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Service updated successfully",
                data: { service: updatedService }
            });
        } catch (err) {
            if ((err as Error).message === "Service not found") {
                next(errorHandler(404, "Service not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update service"));
        }
    };

    deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;
            const { id } = req.params;

            await this.serviceGigService.deleteService(id, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Service deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Service not found") {
                next(errorHandler(404, "Service not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete service"));
        }
    };

    adminDeleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            await this.serviceGigService.adminDeleteService(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Service deleted successfully by admin"
            });
        } catch (err) {
            if ((err as Error).message === "Service not found") {
                next(errorHandler(404, "Service not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete service"));
        }
    };

    // Get service statistics for admin dashboard
    getServiceStatistics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.serviceGigService.getServiceStatistics();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Service statistics retrieved successfully",
                data: { statistics }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve service statistics"));
        }
    };
}
