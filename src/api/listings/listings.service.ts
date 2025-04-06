import { PrismaClient, Listing, Condition, ListingCategory } from '@prisma/client';

interface CreateListingDTO {
    title: string;
    description: string;
    price?: number;
    condition: Condition;
    category: ListingCategory;
    images?: string[];
    isRentable?: boolean;
    rentalPeriod?: number;
}

export class ListingService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async createListing(userId: string, listingData: CreateListingDTO): Promise<Listing> {
        return this.prisma.listing.create({
            data: {
                ...listingData,
                userId,
            },
        });
    }

    async getListingById(id: string): Promise<Listing | null> {
        return this.prisma.listing.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    }

    async getAllListings(options: {
        page?: number;
        limit?: number;
        category?: ListingCategory;
        condition?: Condition;
        isRentable?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        listings: Listing[];
        pagination: {
            totalListings: number;
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
            condition,
            isRentable,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            category?: ListingCategory;
            condition?: Condition;
            isRentable?: boolean;
        } = {};

        if (category) {
            where.category = category;
        }

        if (condition) {
            where.condition = condition;
        }

        if (isRentable !== undefined) {
            where.isRentable = isRentable;
        }

        // Get total count for pagination
        const totalListings = await this.prisma.listing.count({ where });

        // Get listings with filtering, sorting and pagination
        const listings = await this.prisma.listing.findMany({
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
        const totalPages = Math.ceil(totalListings / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            listings,
            pagination: {
                totalListings,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async getUserListings(userId: string, options: {
        page?: number;
        limit?: number;
        category?: ListingCategory;
        condition?: Condition;
        isRentable?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        listings: Listing[];
        pagination: {
            totalListings: number;
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
            condition,
            isRentable,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build filter conditions with user ID
        const where: {
            userId: string;
            category?: ListingCategory;
            condition?: Condition;
            isRentable?: boolean;
        } = { userId };

        if (category) {
            where.category = category;
        }

        if (condition) {
            where.condition = condition;
        }

        if (isRentable !== undefined) {
            where.isRentable = isRentable;
        }

        // Get total count for pagination
        const totalListings = await this.prisma.listing.count({ where });

        // Get user's listings with filtering, sorting and pagination
        const listings = await this.prisma.listing.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalListings / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            listings,
            pagination: {
                totalListings,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async updateListing(id: string, userId: string, updateData: Partial<CreateListingDTO>): Promise<Listing> {
        // First check if the listing exists and belongs to the user
        const listing = await this.prisma.listing.findUnique({
            where: { id }
        });

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.userId !== userId) {
            throw new Error('Unauthorized - You can only update your own listings');
        }

        // Update the listing
        return this.prisma.listing.update({
            where: { id },
            data: updateData
        });
    }

    async deleteListing(id: string, userId: string): Promise<{ id: string }> {
        // First check if the listing exists and belongs to the user
        const listing = await this.prisma.listing.findUnique({
            where: { id }
        });

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.userId !== userId) {
            throw new Error('Unauthorized - You can only delete your own listings');
        }

        // Delete the listing
        await this.prisma.listing.delete({
            where: { id }
        });

        return { id };
    }

    async adminDeleteListing(id: string): Promise<{ id: string }> {
        // First check if the listing exists
        const listing = await this.prisma.listing.findUnique({
            where: { id }
        });

        if (!listing) {
            throw new Error('Listing not found');
        }

        // Delete the listing as admin
        await this.prisma.listing.delete({
            where: { id }
        });

        return { id };
    }

    // Get listing statistics for admin dashboard
    async getListingStatistics() {
        // Total number of listings
        const totalListings = await this.prisma.listing.count();

        // Listings by category
        const categoryDistribution = await Promise.all(
            Object.values(ListingCategory).map(async (category) => {
                const count = await this.prisma.listing.count({
                    where: { category }
                });
                return { category, count };
            })
        );

        // Listings by condition
        const conditionDistribution = await Promise.all(
            Object.values(Condition).map(async (condition) => {
                const count = await this.prisma.listing.count({
                    where: { condition }
                });
                return { condition, count };
            })
        );

        // Rentable vs. sellable listings
        const rentableListings = await this.prisma.listing.count({
            where: { isRentable: true }
        });

        const sellOnlyListings = await this.prisma.listing.count({
            where: { isRentable: false }
        });

        // Most active sellers (top 5)
        const topSellers = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: { Listing: true }
                }
            },
            orderBy: {
                Listing: { _count: 'desc' }
            },
            take: 5
        });

        // Listings created in the last 7 days
        const lastWeekListings = await this.prisma.listing.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Listings created in the last 30 days
        const lastMonthListings = await this.prisma.listing.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent listings (last 5 created or updated)
        const recentListings = await this.prisma.listing.findMany({
            select: {
                id: true,
                title: true,
                category: true,
                condition: true,
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
            FROM "Listing"
            WHERE price IS NOT NULL
        `;

        const averagePrice = priceStats[0]?.avg ? Number(priceStats[0].avg.toFixed(2)) : 0;
        const minPrice = priceStats[0]?.min ? Number(priceStats[0].min) : 0;
        const maxPrice = priceStats[0]?.max ? Number(priceStats[0].max) : 0;

        return {
            totalListings,
            categoryDistribution,
            conditionDistribution,
            listingTypes: {
                rentable: rentableListings,
                sellOnly: sellOnlyListings
            },
            topSellers: topSellers.map(seller => ({
                id: seller.id,
                name: `${seller.firstName} ${seller.lastName}`,
                listingCount: seller._count.Listing
            })),
            recentActivity: {
                lastWeekListings,
                lastMonthListings,
                recentListings
            },
            priceMetrics: {
                averagePrice,
                minPrice,
                maxPrice
            }
        };
    }
}
