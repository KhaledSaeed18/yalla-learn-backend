import { PrismaClient, GigService, GigCategory, ServiceDirection } from '@prisma/client';

interface CreateServiceDTO {
    title: string;
    description: string;
    price?: number | null;
    category: GigCategory;
    direction?: ServiceDirection;
}

export class ServiceGigService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async createService(userId: string, serviceData: CreateServiceDTO): Promise<GigService> {
        return this.prisma.gigService.create({
            data: {
                ...serviceData,
                userId,
            },
        });
    }

    async getServiceById(id: string): Promise<GigService | null> {
        return this.prisma.gigService.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phoneNumber: true,
                        location: true,
                        bio: true,
                    }
                }
            }
        });
    }

    async getAllServices(options: {
        page?: number;
        limit?: number;
        category?: GigCategory;
        direction?: ServiceDirection;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        services: GigService[];
        pagination: {
            totalServices: number;
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
            category,
            direction,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            category?: GigCategory;
            direction?: ServiceDirection;
        } = {};

        if (category) {
            where.category = category;
        }

        if (direction) {
            where.direction = direction;
        }

        // Get total count for pagination
        const totalServices = await this.prisma.gigService.count({ where });

        // Get services with filtering, sorting and pagination
        const services = await this.prisma.gigService.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
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
        const totalPages = Math.ceil(totalServices / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            services,
            pagination: {
                totalServices,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async getUserServices(userId: string, options: {
        page?: number;
        limit?: number;
        category?: GigCategory;
        direction?: ServiceDirection;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        services: GigService[];
        pagination: {
            totalServices: number;
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
            category,
            direction,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions with user ID
        const where: {
            userId: string;
            category?: GigCategory;
            direction?: ServiceDirection;
        } = { userId };

        if (category) {
            where.category = category;
        }

        if (direction) {
            where.direction = direction;
        }

        // Get total count for pagination
        const totalServices = await this.prisma.gigService.count({ where });

        // Get user's services with filtering, sorting and pagination
        const services = await this.prisma.gigService.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalServices / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            services,
            pagination: {
                totalServices,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async updateService(id: string, userId: string, updateData: Partial<CreateServiceDTO>): Promise<GigService> {
        // First check if the service exists and belongs to the user
        const service = await this.prisma.gigService.findUnique({
            where: { id }
        });

        if (!service) {
            throw new Error('Service not found');
        }

        if (service.userId !== userId) {
            throw new Error('Unauthorized - You can only update your own services');
        }

        // If direction is changing to REQUESTING, set price to null
        const finalUpdateData = { ...updateData };
        if (updateData.direction === 'REQUESTING') {
            finalUpdateData.price = null;
        }

        // Update the service
        return this.prisma.gigService.update({
            where: { id },
            data: finalUpdateData
        });
    }

    async deleteService(id: string, userId: string): Promise<{ id: string }> {
        // First check if the service exists and belongs to the user
        const service = await this.prisma.gigService.findUnique({
            where: { id }
        });

        if (!service) {
            throw new Error('Service not found');
        }

        if (service.userId !== userId) {
            throw new Error('Unauthorized - You can only delete your own services');
        }

        // Delete the service
        await this.prisma.gigService.delete({
            where: { id }
        });

        return { id };
    }

    async adminDeleteService(id: string): Promise<{ id: string }> {
        // First check if the service exists
        const service = await this.prisma.gigService.findUnique({
            where: { id }
        });

        if (!service) {
            throw new Error('Service not found');
        }

        // Delete the service as admin
        await this.prisma.gigService.delete({
            where: { id }
        });

        return { id };
    }

    // Get service statistics for admin dashboard
    async getServiceStatistics() {
        // Total number of services
        const totalServices = await this.prisma.gigService.count();

        // Services by category
        const categoryDistribution = await Promise.all(
            Object.values(GigCategory).map(async (category) => {
                const count = await this.prisma.gigService.count({
                    where: { category }
                });
                return { category, count };
            })
        );

        // Services by direction
        const directionDistribution = await Promise.all(
            Object.values(ServiceDirection).map(async (direction) => {
                const count = await this.prisma.gigService.count({
                    where: { direction }
                });
                return { direction, count };
            })
        );

        // Most active service providers (top 5)
        const topProviders = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: { GigService: true }
                }
            },
            orderBy: {
                GigService: { _count: 'desc' }
            },
            take: 5
        });

        // Services created in the last 7 days
        const lastWeekServices = await this.prisma.gigService.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Services created in the last 30 days
        const lastMonthServices = await this.prisma.gigService.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent services (last 5 created or updated)
        const recentServices = await this.prisma.gigService.findMany({
            select: {
                id: true,
                title: true,
                category: true,
                direction: true,
                price: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        // Price statistics
        const priceStats = await this.prisma.$queryRaw<[{ avg: number, min: number, max: number }]>`
            SELECT 
                AVG(price) as avg,
                MIN(price) as min,
                MAX(price) as max
            FROM "GigService"
            WHERE price IS NOT NULL
        `;

        const averagePrice = priceStats[0]?.avg ? Number(priceStats[0].avg.toFixed(2)) : 0;
        const minPrice = priceStats[0]?.min ? Number(priceStats[0].min) : 0;
        const maxPrice = priceStats[0]?.max ? Number(priceStats[0].max) : 0;

        return {
            totalServices,
            categoryDistribution,
            directionDistribution,
            topProviders: topProviders.map(provider => ({
                id: provider.id,
                name: `${provider.firstName} ${provider.lastName}`,
                serviceCount: provider._count.GigService
            })),
            recentActivity: {
                lastWeekServices,
                lastMonthServices,
                recentServices
            },
            priceMetrics: {
                averagePrice,
                minPrice,
                maxPrice
            }
        };
    }
}
