import { Request, Response, NextFunction } from 'express';
import { ListingService } from './listings.service';
import { errorHandler } from '../../utils/errorHandler';

export class ListingController {
    private listingService: ListingService;

    constructor() {
        this.listingService = new ListingService();
    }

    createListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user || !req.user.userId) {
                return next(errorHandler(401, 'Authentication required'));
            }

            const listing = await this.listingService.createListing(req.user.userId, req.body);

            res.status(201).json({
                success: true,
                data: listing,
            });
        } catch (error) {
            next(error);
        }
    };
}
