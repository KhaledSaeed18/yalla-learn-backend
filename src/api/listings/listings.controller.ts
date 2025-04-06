import { Request, Response, NextFunction } from 'express';
import { ListingService } from './listings.service';
import { errorHandler } from '../../utils/errorHandler';
import { Condition, ListingCategory } from '@prisma/client';

export class ListingController {
    private listingService: ListingService;

    constructor() {
        this.listingService = new ListingService();
        this.createListing = this.createListing.bind(this);
        this.getListingById = this.getListingById.bind(this);
        this.getAllListings = this.getAllListings.bind(this);
        this.getUserListings = this.getUserListings.bind(this);
        this.updateListing = this.updateListing.bind(this);
        this.deleteListing = this.deleteListing.bind(this);
        this.adminDeleteListing = this.adminDeleteListing.bind(this);
    }

    createListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, 'Authentication required'));
            }

            const listing = await this.listingService.createListing(req.user.id, req.body);

            res.status(201).json({
                success: true,
                data: listing,
            });
        } catch (error) {
            next(error);
        }
    };

    getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const listing = await this.listingService.getListingById(id);

            if (!listing) {
                return next(errorHandler(404, 'Listing not found'));
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Listing retrieved successfully",
                data: { listing }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve listing"));
        }
    };

    getAllListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {
                page,
                limit,
                category,
                condition,
                isRentable,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                category?: ListingCategory;
                condition?: Condition;
                isRentable?: string;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                category,
                condition,
                isRentable: isRentable ? isRentable === 'true' : undefined,
                sortBy,
                sortOrder
            };

            const result = await this.listingService.getAllListings(options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Listings retrieved successfully",
                data: {
                    listings: result.listings,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve listings"));
        }
    };

    getUserListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;

            const {
                page,
                limit,
                category,
                condition,
                isRentable,
                sortBy,
                sortOrder
            } = req.query as {
                page?: string;
                limit?: string;
                category?: ListingCategory;
                condition?: Condition;
                isRentable?: string;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            };

            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                category,
                condition,
                isRentable: isRentable ? isRentable === 'true' : undefined,
                sortBy,
                sortOrder
            };

            const result = await this.listingService.getUserListings(userId, options);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User listings retrieved successfully",
                data: {
                    listings: result.listings,
                    pagination: result.pagination
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve user listings"));
        }
    };

    updateListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;
            const { id } = req.params;

            const updatedListing = await this.listingService.updateListing(id, userId, req.body);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Listing updated successfully",
                data: { listing: updatedListing }
            });
        } catch (err) {
            if ((err as Error).message === "Listing not found") {
                next(errorHandler(404, "Listing not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update listing"));
        }
    };

    deleteListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.id) {
                return next(errorHandler(401, "Authentication required"));
            }

            const userId = req.user.id;
            const { id } = req.params;

            await this.listingService.deleteListing(id, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Listing deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Listing not found") {
                next(errorHandler(404, "Listing not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete listing"));
        }
    };

    adminDeleteListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            await this.listingService.adminDeleteListing(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Listing deleted successfully by admin"
            });
        } catch (err) {
            if ((err as Error).message === "Listing not found") {
                next(errorHandler(404, "Listing not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete listing"));
        }
    };
}
