import { PrismaClient, Role, User, Prisma } from '@prisma/client';

export interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    bio?: string | null;
    location?: string | null;
    phoneNumber?: string | null;
    avatar?: string | null;
}

export interface AdminUserUpdateData extends UserUpdateData {
    email?: string;
    role?: Role;
    isVerified?: boolean;
}

export interface UserQueryOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export default class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Get user profile by ID
    public async getUserById(userId: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { id: userId }
        });
    }

    // Update user profile
    public async updateUser(userId: string, data: UserUpdateData): Promise<User> {
        return await this.prisma.user.update({
            where: { id: userId },
            data
        });
    }

    // Delete user account
    public async deleteUser(userId: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id: userId }
        });
    }

    // Admin: Get all users with filters and pagination
    public async getUsers(options: UserQueryOptions = {}): Promise<{ users: User[], total: number, totalPages: number }> {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            isVerified,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build where condition based on filters
        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isVerified !== undefined) {
            where.isVerified = isVerified;
        }

        // Get total count for pagination
        const total = await this.prisma.user.count({ where });
        const totalPages = Math.ceil(total / limit);

        // Get users with pagination and sorting
        const users = await this.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder
            }
        });

        return {
            users,
            total,
            totalPages
        };
    }

    // Admin: Delete any user by ID
    public async adminDeleteUser(userId: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id: userId }
        });
    }

    // Admin: Update any user by ID
    public async adminUpdateUser(userId: string, data: AdminUserUpdateData): Promise<User> {
        return await this.prisma.user.update({
            where: { id: userId },
            data
        });
    }

    // Admin: Get user statistics for dashboard
    public async getUserStatistics(): Promise<{
        totalUsers: number;
        newUsersToday: number;
        verifiedUsers: number;
        unverifiedUsers: number;
        adminUsers: number;
        regularUsers: number;
        usersByMonth: Array<{ month: string; count: number }>;
    }> {
        // Get total number of users
        const totalUsers = await this.prisma.user.count();

        // Get new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = await this.prisma.user.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        // Get verified and unverified users count
        const verifiedUsers = await this.prisma.user.count({
            where: { isVerified: true }
        });
        const unverifiedUsers = await this.prisma.user.count({
            where: { isVerified: false }
        });

        // Get admin and regular users count
        const adminUsers = await this.prisma.user.count({
            where: { role: 'ADMIN' }
        });
        const regularUsers = await this.prisma.user.count({
            where: { role: 'USER' }
        });

        // Get users by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch users created since 6 months ago
        const recentUsers = await this.prisma.user.findMany({
            where: {
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                createdAt: true
            }
        });

        // Group users by month
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            months[monthKey] = 0;
        }

        // Count users by month
        recentUsers.forEach(user => {
            const date = new Date(user.createdAt);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (months[monthKey] !== undefined) {
                months[monthKey]++;
            }
        });

        // Convert to array format for frontend
        const usersByMonth = Object.entries(months)
            .map(([month, count]) => ({ month, count }))
            .reverse(); // Most recent month first

        return {
            totalUsers,
            newUsersToday,
            verifiedUsers,
            unverifiedUsers,
            adminUsers,
            regularUsers,
            usersByMonth
        };
    }
}