import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';
import { createJobValidation, updateJobValidation, validateGetJobsQuery, createApplicationValidation, updateApplicationStatusValidation } from './jobs.validation';
import { jobCreateLimiter, jobGetLimiter, jobUpdateLimiter, jobDeleteLimiter, applicationCreateLimiter, applicationGetLimiter } from './jobs.rateLimiting';

export default class JobRouter {
    private router: Router;
    private jobsController: JobsController;

    constructor() {
        this.router = Router();
        this.jobsController = new JobsController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Admin job routes
        this.router.post(
            '/admin/create',
            authorize,
            authorizeAdmin,
            jobCreateLimiter,
            sanitizeRequestBody,
            createJobValidation,
            this.jobsController.createJob
        );

        this.router.get(
            '/admin/all',
            authorize,
            authorizeAdmin,
            jobGetLimiter,
            validateGetJobsQuery,
            this.jobsController.getAllJobs
        );

        this.router.get(
            '/admin/statistics',
            authorize,
            authorizeAdmin,
            jobGetLimiter,
            this.jobsController.getJobStatistics
        );

        this.router.put(
            '/admin/update/:id',
            authorize,
            authorizeAdmin,
            jobUpdateLimiter,
            sanitizeRequestBody,
            updateJobValidation,
            this.jobsController.updateJob
        );

        this.router.delete(
            '/admin/delete/:id',
            authorize,
            authorizeAdmin,
            jobDeleteLimiter,
            this.jobsController.deleteJob
        );

        // Public job routes
        this.router.get(
            '/browse',
            jobGetLimiter,
            validateGetJobsQuery,
            this.jobsController.browseJobs
        );

        this.router.get(
            '/details/:id',
            jobGetLimiter,
            this.jobsController.getJobById
        );

        // Job applications routes
        this.router.post(
            '/apply/:id',
            authorize,
            applicationCreateLimiter,
            sanitizeRequestBody,
            createApplicationValidation,
            this.jobsController.applyForJob
        );

        this.router.get(
            '/applications/user',
            authorize,
            applicationGetLimiter,
            this.jobsController.getUserApplications
        );

        this.router.get(
            '/applications/:id',
            authorize,
            applicationGetLimiter,
            this.jobsController.getApplicationById
        );

        this.router.get(
            '/admin/applications/:jobId',
            authorize,
            authorizeAdmin,
            applicationGetLimiter,
            this.jobsController.getJobApplications
        );

        this.router.put(
            '/admin/applications/:id/status',
            authorize,
            authorizeAdmin,
            jobUpdateLimiter,
            sanitizeRequestBody,
            updateApplicationStatusValidation,
            this.jobsController.updateApplicationStatus
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
