import { Router } from 'express';
import { ListingController } from './listings.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { createListingValidation, validateGetListingsQuery } from './listings.validation';
import { createListingLimiter, listingGetLimiter, listingAdminGetLimiter } from './listings.rateLimiting';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

const router = Router();
const listingController = new ListingController();

// Create a new listing
router.post(
    '/add',
    authorize,
    createListingLimiter,
    sanitizeRequestBody,
    createListingValidation,
    listingController.createListing
);

// Get a listing by ID
router.get(
    '/:id',
    listingGetLimiter,
    listingController.getListingById
);

// Get all listings (admin only)
router.get(
    '/admin/all',
    authorize,
    authorizeAdmin,
    listingAdminGetLimiter,
    validateGetListingsQuery,
    listingController.getAllListings
);

// Get user's own listings
router.get(
    '/user/my-listings',
    authorize,
    listingGetLimiter,
    validateGetListingsQuery,
    listingController.getUserListings
);

export default router;
