import { Router } from 'express';
import UserController from './user.controller';
import { authorize, authorizeAdmin } from '../../middlewares/authorization.middleware';
import { profileGetLimiter, profileUpdateLimiter, profileDeleteLimiter, passwordChangeLimiter, adminUsersGetLimiter, adminUserDeleteLimiter, adminUserAnalyticsLimiter } from './user.rateLimiting';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';
import { validateUserUpdate, validateGetUsersQuery, validatePasswordChange } from './user.validation';

export default class UserRouter {
    private router: Router;
    private userController: UserController;

    constructor() {
        this.router = Router();
        this.userController = new UserController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // User profile routes
        this.router.get(
            "/profile",
            authorize,
            profileGetLimiter,
            this.userController.getUserProfile
        );

        this.router.put(
            "/update-profile",
            authorize,
            profileUpdateLimiter,
            sanitizeRequestBody,
            validateUserUpdate,
            this.userController.updateUserProfile
        );

        this.router.delete(
            "/delete-account",
            authorize,
            profileDeleteLimiter,
            this.userController.deleteUserAccount
        );

        this.router.post(
            "/change-password",
            authorize,
            passwordChangeLimiter,
            sanitizeRequestBody,
            validatePasswordChange,
            this.userController.changePassword
        );

        // Admin routes for user management
        this.router.get(
            "/admin/users",
            authorize,
            authorizeAdmin,
            adminUsersGetLimiter,
            validateGetUsersQuery,
            this.userController.getAllUsers
        );

        this.router.delete(
            "/admin/delete-user/:id",
            authorize,
            authorizeAdmin,
            adminUserDeleteLimiter,
            this.userController.adminDeleteUser
        );

        this.router.get(
            "/admin/statistics",
            authorize,
            authorizeAdmin,
            adminUserAnalyticsLimiter,
            this.userController.getUserStatistics
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}