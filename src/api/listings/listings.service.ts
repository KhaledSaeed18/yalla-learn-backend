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
}
