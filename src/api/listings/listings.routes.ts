import { Router } from 'express';
import { ListingController } from './listings.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { createListingValidation, validateGetListingsQuery } from './listings.validation';
import { createListingLimiter, listingGetLimiter, listingAdminGetLimiter } from './listings.rateLimiting';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class ListingRouter {
    private router: Router;
    private listingController: ListingController;

    constructor() {
        this.router = Router();
        this.listingController = new ListingController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Create a new listing
        this.router.post(
            '/add',
            authorize,
            createListingLimiter,
            sanitizeRequestBody,
            createListingValidation,
            this.listingController.createListing
        );

        // Get a listing by ID
        this.router.get(
            '/:id',
            listingGetLimiter,
            this.listingController.getListingById
        );

        // Get all listings (admin only)
        this.router.get(
            '/admin/all',
            authorize,
            authorizeAdmin,
            listingAdminGetLimiter,
            validateGetListingsQuery,
            this.listingController.getAllListings
        );

        // Get user's own listings
        this.router.get(
            '/user/my-listings',
            authorize,
            listingGetLimiter,
            validateGetListingsQuery,
            this.listingController.getUserListings
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
