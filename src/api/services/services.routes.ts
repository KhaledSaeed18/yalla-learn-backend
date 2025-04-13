import { Router } from 'express';
import { ServiceController } from './services.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { createServiceValidation, updateServiceValidation, validateGetServicesQuery } from './services.validation';
import { createServiceLimiter, serviceGetLimiter, serviceAdminGetLimiter, serviceUpdateLimiter, serviceDeleteLimiter } from './services.rateLimiting';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class ServiceRouter {
    private router: Router;
    private serviceController: ServiceController;

    constructor() {
        this.router = Router();
        this.serviceController = new ServiceController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Create a new service
        this.router.post(
            '/add',
            authorize,
            createServiceLimiter,
            sanitizeRequestBody,
            createServiceValidation,
            this.serviceController.createService
        );

        // Get a service by ID
        this.router.get(
            '/get-service/:id',
            serviceGetLimiter,
            this.serviceController.getServiceById
        );

        // Get all services
        this.router.get(
            '/get-services',
            serviceAdminGetLimiter,
            validateGetServicesQuery,
            this.serviceController.getAllServices
        );

        // Get user's own services
        this.router.get(
            '/user/my-services',
            authorize,
            serviceGetLimiter,
            validateGetServicesQuery,
            this.serviceController.getUserServices
        );

        // Update a service
        this.router.put(
            '/update-service/:id',
            authorize,
            serviceUpdateLimiter,
            sanitizeRequestBody,
            updateServiceValidation,
            this.serviceController.updateService
        );

        // Delete a service
        this.router.delete(
            '/delete-service/:id',
            authorize,
            serviceDeleteLimiter,
            this.serviceController.deleteService
        );

        // Admin delete any service
        this.router.delete(
            '/admin/delete-service/:id',
            authorize,
            authorizeAdmin,
            serviceDeleteLimiter,
            this.serviceController.adminDeleteService
        );

        // Get service statistics for admin dashboard
        this.router.get(
            '/admin/statistics',
            authorize,
            authorizeAdmin,
            serviceGetLimiter,
            this.serviceController.getServiceStatistics
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
