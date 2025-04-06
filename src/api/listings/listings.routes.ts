import { Router } from 'express';
import { ListingController } from './listings.controller';
import { authorize } from '../../middlewares/authorization.middleware';
import { createListingValidation } from './listings.validation';
import { createListingLimiter } from './listings.rateLimiting';

const router = Router();
const listingController = new ListingController();

router.post(
    '/add',
    authorize,
    createListingLimiter,
    createListingValidation,
    listingController.createListing
);

export default router;
