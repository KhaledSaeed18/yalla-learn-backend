/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Report, ReportStatus } from '@prisma/client';

export class ReportService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Create a new campus report
     */
    async createReport(userId: string, data: {
        title: string;
        description: string;
        location?: string;
        isEmergency?: boolean;
    }): Promise<Report> {
        return this.prisma.report.create({
            data: {
                ...data,
                userId
            }
        });
    }

    /**
     * Get reports with pagination
     * If userId is provided, only return reports for that user
     * If admin is true, return all reports
     */
    async getReports(options: {
        userId?: string;
        isAdmin?: boolean;
        page?: number;
        limit?: number;
        status?: ReportStatus;
        isEmergency?: boolean;
    } = {}): Promise<{ reports: Report[]; total: number; page: number; limit: number }> {
        const {
            userId,
            isAdmin = false,
            page = 1,
            limit = 10,
            status,
            isEmergency
        } = options;

        const skip = (page - 1) * limit;

        // Build where clause based on filters
        const where: any = {};

        // Only filter by userId if not admin or userId is explicitly provided
        if (!isAdmin || userId) {
            where.userId = userId;
        }

        if (status) {
            where.status = status;
        }

        if (isEmergency !== undefined) {
            where.isEmergency = isEmergency;
        }

        // Get reports with count
        const [reports, total] = await Promise.all([
            this.prisma.report.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.report.count({ where })
        ]);

        return {
            reports,
            total,
            page,
            limit
        };
    }

    /**
     * Get a specific report by ID
     */
    async getReportById(id: string, userId?: string, isAdmin = false): Promise<Report | null> {
        const report = await this.prisma.report.findUnique({
            where: { id }
        });

        if (!report) {
            throw new Error('Report not found');
        }

        // Only allow access if admin or the report owner
        if (!isAdmin && report.userId !== userId) {
            throw new Error('Unauthorized - You can only view your own reports');
        }

        return report;
    }

    /**
     * Delete a report by ID
     */
    async deleteReport(id: string, userId: string, isAdmin = false): Promise<void> {
        const report = await this.prisma.report.findUnique({
            where: { id }
        });

        if (!report) {
            throw new Error('Report not found');
        }

        // Only allow deletion if admin or the report owner
        if (!isAdmin && report.userId !== userId) {
            throw new Error('Unauthorized - You can only delete your own reports');
        }

        await this.prisma.report.delete({
            where: { id }
        });
    }

    /**
     * Update report status (admin only)
     */
    async updateReportStatus(id: string, status: ReportStatus): Promise<Report> {
        const report = await this.prisma.report.findUnique({
            where: { id }
        });

        if (!report) {
            throw new Error('Report not found');
        }

        return this.prisma.report.update({
            where: { id },
            data: { status }
        });
    }
}

export default ReportService;
