import { Router } from 'express';
import { ListingController } from './listings.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { createListingValidation, updateListingValidation, validateGetListingsQuery } from './listings.validation';
import { createListingLimiter, listingGetLimiter, listingAdminGetLimiter, listingUpdateLimiter, listingDeleteLimiter } from './listings.rateLimiting';
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
            '/get-listing/:id',
            listingGetLimiter,
            this.listingController.getListingById
        );

        // Get all listings
        this.router.get(
            '/get-listings',
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

        // Update a listing
        this.router.put(
            '/update-listing/:id',
            authorize,
            listingUpdateLimiter,
            sanitizeRequestBody,
            updateListingValidation,
            this.listingController.updateListing
        );

        // Delete a listing
        this.router.delete(
            '/delete-listing/:id',
            authorize,
            listingDeleteLimiter,
            this.listingController.deleteListing
        );

        // Admin delete any listing
        this.router.delete(
            '/admin/delete-listing/:id',
            authorize,
            authorizeAdmin,
            listingDeleteLimiter,
            this.listingController.adminDeleteListing
        );

        // Get listing statistics for admin dashboard
        this.router.get(
            '/admin/statistics',
            authorize,
            authorizeAdmin,
            listingGetLimiter,
            this.listingController.getListingStatistics
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
