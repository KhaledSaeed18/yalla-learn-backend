import { Request, Response, NextFunction } from 'express';
import { JobsService } from './jobs.service';
import { errorHandler } from '../../utils/errorHandler';
import { ApplicationStatus, JobStatus, JobType } from '@prisma/client';

export class JobsController {
    private jobsService: JobsService;

    constructor() {
        this.jobsService = new JobsService();
        this.createJob = this.createJob.bind(this);
        this.getJobById = this.getJobById.bind(this);
        this.getAllJobs = this.getAllJobs.bind(this);
        this.browseJobs = this.browseJobs.bind(this);
        this.updateJob = this.updateJob.bind(this);
        this.deleteJob = this.deleteJob.bind(this);
        this.applyForJob = this.applyForJob.bind(this);
        this.getApplicationById = this.getApplicationById.bind(this);
        this.getUserApplications = this.getUserApplications.bind(this);
        this.getJobApplications = this.getJobApplications.bind(this);
        this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
        this.getJobStatistics = this.getJobStatistics.bind(this);
    }

    // ************************ JOBS CONTROLLERS ************************ //

    // Admin: Create a new job
    async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.userId;
            const job = await this.jobsService.createJob(userId, req.body);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Job created successfully",
                data: { job }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create job"));
        }
    }

    // Get job details by ID
    async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const job = await this.jobsService.getJobById(id);

            if (!job) {
                return next(errorHandler(404, "Job not found"));
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Job retrieved successfully",
                data: { job }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve job"));
        }
    }

    // Admin: Get all jobs with filters
    async getAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                page,
                limit,
                status,
                type,
                search,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                status?: JobStatus;
                type?: JobType;
                search?: string;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status,
                type,
                search,
                sortBy,
                sortOrder
            };

            const result = await this.jobsService.getAllJobs(options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Jobs retrieved successfully",
                data: {
                    jobs: result.jobs,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve jobs"));
        }
    }

    // User: Browse active jobs with filters
    async browseJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                page,
                limit,
                type,
                search,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                type?: JobType;
                search?: string;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                type,
                search,
                sortBy,
                sortOrder
            };

            const result = await this.jobsService.browseJobs(options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Jobs retrieved successfully",
                data: {
                    jobs: result.jobs,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve jobs"));
        }
    }

    // Admin: Update a job
    async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.userId;
            const { id } = req.params;

            const updatedJob = await this.jobsService.updateJob(id, userId, req.body);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Job updated successfully",
                data: { job: updatedJob }
            });
        } catch (err) {
            if ((err as Error).message === "Job not found") {
                next(errorHandler(404, "Job not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update job"));
        }
    }

    // Admin: Delete a job
    async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            await this.jobsService.deleteJob(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Job deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Job not found") {
                next(errorHandler(404, "Job not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete job"));
        }
    }

    // ************************ JOB APPLICATIONS CONTROLLERS ************************ //

    // User: Apply for a job
    async applyForJob(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.userId;
            const { id: jobId } = req.params;

            const application = await this.jobsService.applyForJob(jobId, userId, req.body);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Application submitted successfully",
                data: { application }
            });
        } catch (err) {
            if ((err as Error).message === "Job not found or not active") {
                next(errorHandler(404, "Job not found or not active"));
                return;
            }
            if ((err as Error).message === "You have already applied for this job") {
                next(errorHandler(409, "You have already applied for this job"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to submit application"));
        }
    }

    // Get application by ID
    async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.userId;
            const { id } = req.params;
            const isAdmin = req.user.role === 'ADMIN';

            const application = await this.jobsService.getApplicationById(id, userId, isAdmin);

            if (!application) {
                return next(errorHandler(404, "Application not found"));
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Application retrieved successfully",
                data: { application }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve application"));
        }
    }

    // User: Get user's job applications
    async getUserApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.userId;
            const {
                page,
                limit,
                status,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                status?: ApplicationStatus;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status,
                sortBy,
                sortOrder
            };

            const result = await this.jobsService.getUserApplications(userId, options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Applications retrieved successfully",
                data: {
                    applications: result.applications,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve applications"));
        }
    }

    // Admin: Get applications for a specific job
    async getJobApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { jobId } = req.params;
            const {
                page,
                limit,
                status,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                status?: ApplicationStatus;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status,
                sortBy,
                sortOrder
            };

            const result = await this.jobsService.getJobApplications(jobId, options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Applications retrieved successfully",
                data: {
                    applications: result.applications,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve applications"));
        }
    }

    // Admin: Update application status
    async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updatedApplication = await this.jobsService.updateApplicationStatus(id, status);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Application status updated successfully",
                data: { application: updatedApplication }
            });
        } catch (err) {
            if ((err as Error).message === "Application not found") {
                next(errorHandler(404, "Application not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update application status"));
        }
    }

    // ************************ STATISTICS CONTROLLERS ************************ //

    // Admin: Get job statistics for dashboard
    async getJobStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const statistics = await this.jobsService.getJobStatistics();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Job statistics retrieved successfully",
                data: { statistics }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve job statistics"));
        }
    }
}
