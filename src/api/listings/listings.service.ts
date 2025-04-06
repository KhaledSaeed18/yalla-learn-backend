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
}
