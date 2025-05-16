/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Job, JobApplication, JobType, JobStatus, ApplicationStatus } from '@prisma/client';

interface CreateJobDTO {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string;
    salary?: string;
    type: JobType;
    status?: JobStatus;
    applicationUrl?: string;
    deadline?: Date;
}

interface CreateApplicationDTO {
    coverLetter?: string;
    resume?: string;
}

export class JobsService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // ************************ JOBS METHODS ************************ //

    async createJob(adminId: string, jobData: CreateJobDTO): Promise<Job> {
        return this.prisma.job.create({
            data: {
                ...jobData,
                postedBy: adminId,
            },
        });
    }

    async getJobById(id: string): Promise<Job | null> {
        return this.prisma.job.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                }
            }
        });
    }

    async getAllJobs(options: {
        page?: number;
        limit?: number;
        status?: JobStatus;
        type?: JobType;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        jobs: Job[];
        pagination: {
            totalJobs: number;
            totalPages: number;
            currentPage: number;
            limit: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            status,
            type,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            status?: JobStatus;
            type?: JobType;
            OR?: Array<{
                title?: { contains: string; mode: 'insensitive' };
                company?: { contains: string; mode: 'insensitive' };
                location?: { contains: string; mode: 'insensitive' };
                description?: { contains: string; mode: 'insensitive' };
            }>;
        } = {};

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count for pagination
        const totalJobs = await this.prisma.job.count({ where });

        // Get jobs with filtering, sorting and pagination
        const jobs = await this.prisma.job.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                _count: {
                    select: {
                        applications: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalJobs / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            jobs,
            pagination: {
                totalJobs,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async browseJobs(options: {
        page?: number;
        limit?: number;
        type?: JobType;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        jobs: Job[];
        pagination: {
            totalJobs: number;
            totalPages: number;
            currentPage: number;
            limit: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            type,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions - only show ACTIVE jobs
        const where: {
            status: JobStatus;
            type?: JobType;
            OR?: any[];
        } = {
            status: 'ACTIVE'
        };

        if (type) {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count for pagination
        const totalJobs = await this.prisma.job.count({ where });

        // Get jobs with filtering, sorting and pagination
        const jobs = await this.prisma.job.findMany({
            where,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalJobs / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            jobs,
            pagination: {
                totalJobs,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async updateJob(id: string, adminId: string, updateData: Partial<CreateJobDTO>): Promise<Job> {
        // First check if the job exists
        const job = await this.prisma.job.findUnique({
            where: { id }
        });

        if (!job) {
            throw new Error('Job not found');
        }

        // Update the job
        return this.prisma.job.update({
            where: { id },
            data: updateData
        });
    }

    async deleteJob(id: string): Promise<{ id: string }> {
        // First check if the job exists
        const job = await this.prisma.job.findUnique({
            where: { id }
        });

        if (!job) {
            throw new Error('Job not found');
        }

        // Delete the job
        await this.prisma.job.delete({
            where: { id }
        });

        return { id };
    }

    // ************************ JOB APPLICATIONS METHODS ************************ //

    async applyForJob(jobId: string, userId: string, applicationData: CreateApplicationDTO): Promise<JobApplication> {
        // First check if the job exists and is active
        const job = await this.prisma.job.findFirst({
            where: {
                id: jobId,
                status: 'ACTIVE'
            }
        });

        if (!job) {
            throw new Error('Job not found or not active');
        }

        // Check if user has already applied
        const existingApplication = await this.prisma.jobApplication.findUnique({
            where: {
                jobId_applicantId: {
                    jobId,
                    applicantId: userId
                }
            }
        });

        if (existingApplication) {
            throw new Error('You have already applied for this job');
        }

        // Create the application
        return this.prisma.jobApplication.create({
            data: {
                ...applicationData,
                jobId,
                applicantId: userId
            }
        });
    }

    async getApplicationById(id: string, userId: string, isAdmin: boolean): Promise<JobApplication | null> {
        const whereClause = isAdmin
            ? { id }
            : {
                id,
                applicantId: userId
            };

        return this.prisma.jobApplication.findFirst({
            where: whereClause,
            include: {
                job: true,
                applicant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phoneNumber: true,
                        location: true
                    }
                }
            }
        });
    }

    async getUserApplications(userId: string, options: {
        page?: number;
        limit?: number;
        status?: ApplicationStatus;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        applications: JobApplication[];
        pagination: {
            totalApplications: number;
            totalPages: number;
            currentPage: number;
            limit: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            applicantId: string;
            status?: ApplicationStatus;
        } = { applicantId: userId };

        if (status) {
            where.status = status;
        }

        // Get total count for pagination
        const totalApplications = await this.prisma.jobApplication.count({ where });

        // Get applications with filtering, sorting and pagination
        const applications = await this.prisma.jobApplication.findMany({
            where,
            include: {
                job: true
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalApplications / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            applications,
            pagination: {
                totalApplications,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async getJobApplications(jobId: string, options: {
        page?: number;
        limit?: number;
        status?: ApplicationStatus;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        applications: JobApplication[];
        pagination: {
            totalApplications: number;
            totalPages: number;
            currentPage: number;
            limit: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            jobId: string;
            status?: ApplicationStatus;
        } = { jobId };

        if (status) {
            where.status = status;
        }

        // Get total count for pagination
        const totalApplications = await this.prisma.jobApplication.count({ where });

        // Get applications with filtering, sorting and pagination
        const applications = await this.prisma.jobApplication.findMany({
            where,
            include: {
                applicant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phoneNumber: true,
                        location: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalApplications / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            applications,
            pagination: {
                totalApplications,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<JobApplication> {
        // First check if the application exists
        const application = await this.prisma.jobApplication.findUnique({
            where: { id }
        });

        if (!application) {
            throw new Error('Application not found');
        }

        // Update the application status
        return this.prisma.jobApplication.update({
            where: { id },
            data: { status }
        });
    }

    // ************************ STATISTICS METHODS ************************ //

    async getJobStatistics() {
        // Total number of jobs
        const totalJobs = await this.prisma.job.count();

        // Active jobs count
        const activeJobs = await this.prisma.job.count({
            where: { status: 'ACTIVE' }
        });

        // Closed jobs count
        const closedJobs = await this.prisma.job.count({
            where: { status: 'CLOSED' }
        });

        // Draft jobs count
        const draftJobs = await this.prisma.job.count({
            where: { status: 'DRAFT' }
        });

        // Jobs by type
        const jobTypeDistribution = await Promise.all(
            Object.values(JobType).map(async (type) => {
                const count = await this.prisma.job.count({
                    where: { type }
                });
                return { type, count };
            })
        );

        // Total applications
        const totalApplications = await this.prisma.jobApplication.count();

        // Applications by status
        const applicationStatusDistribution = await Promise.all(
            Object.values(ApplicationStatus).map(async (status) => {
                const count = await this.prisma.jobApplication.count({
                    where: { status }
                });
                return { status, count };
            })
        );

        // Jobs created in the last 7 days
        const lastWeekJobs = await this.prisma.job.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Jobs created in the last 30 days
        const lastMonthJobs = await this.prisma.job.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent jobs (last 5 created)
        const recentJobs = await this.prisma.job.findMany({
            select: {
                id: true,
                title: true,
                company: true,
                location: true,
                type: true,
                status: true,
                createdAt: true,
                _count: {
                    select: { applications: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Jobs with most applications
        const popularJobs = await this.prisma.job.findMany({
            select: {
                id: true,
                title: true,
                company: true,
                type: true,
                status: true,
                _count: {
                    select: { applications: true }
                }
            },
            orderBy: {
                applications: { _count: 'desc' }
            },
            take: 5
        });

        return {
            totalJobs,
            jobsByStatus: {
                active: activeJobs,
                closed: closedJobs,
                draft: draftJobs
            },
            jobTypeDistribution,
            applications: {
                total: totalApplications,
                statusDistribution: applicationStatusDistribution
            },
            recentActivity: {
                lastWeekJobs,
                lastMonthJobs,
                recentJobs
            },
            popularJobs
        };
    }
}
