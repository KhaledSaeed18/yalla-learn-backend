/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import UserService, { UserUpdateData, UserQueryOptions } from "./user.service";
import { errorHandler } from "../../utils/errorHandler";
import { User } from "@prisma/client";

export default class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
        this.getUserProfile = this.getUserProfile.bind(this);
        this.updateUserProfile = this.updateUserProfile.bind(this);
        this.deleteUserAccount = this.deleteUserAccount.bind(this);
        this.getAllUsers = this.getAllUsers.bind(this);
        this.adminDeleteUser = this.adminDeleteUser.bind(this);
        this.getUserStatistics = this.getUserStatistics.bind(this);
        this.changePassword = this.changePassword.bind(this);
    }

    // Utility function to remove sensitive information from user object
    private sanitizeUserData(user: User) {
        const {
            password,
            verificationCode,
            codeExpiry,
            resetPasswordCode,
            resetPasswordExpiry,
            totpSecret,
            ...sanitizedUser
        } = user;

        return sanitizedUser;
    }

    // Get the authenticated user's profile
    async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // User ID will be added by the authorize middleware
            const userId = req.user?.userId;

            if (!userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const user = await this.userService.getUserById(userId);

            if (!user) {
                next(errorHandler(404, "User not found"));
                return;
            }

            const sanitizedUser = this.sanitizeUserData(user);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User profile retrieved successfully",
                data: { user: sanitizedUser }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve user profile"));
        }
    }

    // Update the authenticated user's profile
    async updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const updateData: UserUpdateData = req.body;

            const updatedUser = await this.userService.updateUser(userId, updateData);
            const sanitizedUser = this.sanitizeUserData(updatedUser);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User profile updated successfully",
                data: { user: sanitizedUser }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to update user profile"));
        }
    }

    // Delete the authenticated user's account
    async deleteUserAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            await this.userService.deleteUser(userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User account deleted successfully"
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to delete user account"));
        }
    }

    // Admin: Get all users with filtering and pagination
    async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Query parameters will be validated by middleware
            const queryOptions: UserQueryOptions = req.query as unknown as UserQueryOptions;

            const { users, total, totalPages } = await this.userService.getUsers(queryOptions);

            // Remove sensitive information from each user
            const sanitizedUsers = users.map(user => this.sanitizeUserData(user));

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Users retrieved successfully",
                data: {
                    users: sanitizedUsers,
                    pagination: {
                        total,
                        totalPages,
                        currentPage: queryOptions.page || 1,
                        perPage: queryOptions.limit || 10
                    }
                }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve users"));
        }
    }

    // Admin: Delete any user by ID
    async adminDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                next(errorHandler(400, "User ID is required"));
                return;
            }

            // Check if the user exists before deleting
            const user = await this.userService.getUserById(id);

            if (!user) {
                next(errorHandler(404, "User not found"));
                return;
            }

            await this.userService.adminDeleteUser(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User deleted successfully"
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to delete user"));
        }
    }

    // Admin: Get user statistics for dashboard
    async getUserStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const statistics = await this.userService.getUserStatistics();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User statistics retrieved successfully",
                data: { statistics }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve user statistics"));
        }
    }

    // Change the authenticated user's password
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { oldPassword, newPassword } = req.body;

            const result = await this.userService.changePassword(userId, oldPassword, newPassword);

            if (!result.success) {
                next(errorHandler(400, result.message || "Failed to change password"));
                return;
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Password changed successfully"
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to change password"));
        }
    }
}