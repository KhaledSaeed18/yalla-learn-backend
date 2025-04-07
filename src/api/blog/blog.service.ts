import { PrismaClient, BlogStatus } from "@prisma/client";
import { BlogPostUpdateData } from "../../types/blog.types";

export interface BlogQueryOptions {
    page?: number;
    limit?: number;
    status?: BlogStatus;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class BlogService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Create a blog category
    public async createCategory(name: string, slug: string, description?: string | null) {
        const existingCategory = await this.prisma.blogCategory.findUnique({
            where: { slug }
        });

        if (existingCategory) {
            throw new Error("Category with this slug already exists");
        }

        const category = await this.prisma.blogCategory.create({
            data: {
                name,
                slug,
                description
            }
        });

        return category;
    }

    // Get all blog categories
    public async getCategories() {
        const categories = await this.prisma.blogCategory.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return categories;
    }

    // Get blog posts for a specific user
    public async getUserBlogPosts(userId: string, options: BlogQueryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            categoryId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        const where: {
            userId: string;
            status?: BlogStatus;
            categories?: { some: { id: string } };
            OR?: Array<
                | { title: { contains: string; mode: 'insensitive' } }
                | { content: { contains: string; mode: 'insensitive' } }
                | { excerpt: { contains: string; mode: 'insensitive' } }
            >;
        } = { userId };

        // Filter by status if provided
        if (status) {
            where.status = status;
        }

        // Filter by category if provided
        if (categoryId) {
            where.categories = {
                some: {
                    id: categoryId
                }
            };
        }

        // Search functionality
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination
        const totalCount = await this.prisma.blogPost.count({ where });

        // Get user's blog posts with filtering, sorting and pagination
        const posts = await this.prisma.blogPost.findMany({
            where,
            include: {
                categories: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        return {
            posts,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    // Get a blog category by id
    public async getCategoryById(id: string) {
        const category = await this.prisma.blogCategory.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!category) {
            throw new Error("Category not found");
        }

        return category;
    }

    // Update a blog category
    public async updateCategory(id: string, data: {
        name?: string;
        slug?: string;
        description?: string | null;
    }) {
        const category = await this.prisma.blogCategory.findUnique({
            where: { id }
        });

        if (!category) {
            throw new Error("Category not found");
        }

        // Check if slug is being updated and if it already exists
        if (data.slug && data.slug !== category.slug) {
            const existingCategory = await this.prisma.blogCategory.findUnique({
                where: { slug: data.slug }
            });

            if (existingCategory) {
                throw new Error("Category with this slug already exists");
            }
        }

        const updatedCategory = await this.prisma.blogCategory.update({
            where: { id },
            data
        });

        return updatedCategory;
    }

    // Delete a blog category
    public async deleteCategory(id: string) {
        const category = await this.prisma.blogCategory.findUnique({
            where: { id },
            include: {
                posts: true
            }
        });

        if (!category) {
            throw new Error("Category not found");
        }

        if (category.posts.length > 0) {
            throw new Error("Cannot delete category with associated posts");
        }

        await this.prisma.blogCategory.delete({
            where: { id }
        });

        return { id };
    }

    // Create a blog post
    public async createBlogPost(
        userId: string,
        title: string,
        slug: string,
        content: string,
        categoryIds: string[] = [],
        excerpt?: string | null,
        thumbnail?: string | null,
        status: BlogStatus = BlogStatus.DRAFT,
        readTime?: number | null,
        publishedAt?: string | null
    ) {
        const existingPost = await this.prisma.blogPost.findUnique({
            where: { slug }
        });

        if (existingPost) {
            throw new Error("Blog post with this slug already exists");
        }

        // Validate that the categories exist
        if (categoryIds.length > 0) {
            const categories = await this.prisma.blogCategory.findMany({
                where: {
                    id: {
                        in: categoryIds
                    }
                }
            });

            if (categories.length !== categoryIds.length) {
                throw new Error("One or more categories not found");
            }
        }

        let parsedPublishedAt: Date | null = null;
        if (status === BlogStatus.PUBLISHED) {
            parsedPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
        }

        const post = await this.prisma.blogPost.create({
            data: {
                title,
                slug,
                content,
                excerpt,
                thumbnail,
                status,
                readTime,
                publishedAt: parsedPublishedAt,
                userId,
                categories: {
                    connect: categoryIds.map(id => ({ id }))
                }
            },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return post;
    }

    // Get blog posts with filters and pagination
    public async getBlogPosts(options: BlogQueryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            categoryId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        const where: {
            status?: BlogStatus;
            categories?: { some: { id: string } };
            OR?: Array<
                | { title: { contains: string; mode: 'insensitive' } }
                | { content: { contains: string; mode: 'insensitive' } }
                | { excerpt: { contains: string; mode: 'insensitive' } }
            >;
        } = {};

        // Filter by status if provided
        if (status) {
            where.status = status;
        }

        // Filter by category if provided
        if (categoryId) {
            where.categories = {
                some: {
                    id: categoryId
                }
            };
        }

        // Search functionality
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination
        const totalCount = await this.prisma.blogPost.count({ where });

        // Get blog posts with filtering, sorting and pagination
        const posts = await this.prisma.blogPost.findMany({
            where,
            include: {
                categories: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        return {
            posts,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    // Get a blog post by id or slug
    public async getBlogPostByIdOrSlug(idOrSlug: string) {
        const post = await this.prisma.blogPost.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            include: {
                categories: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        bio: true,
                        location: true
                    }
                }
            }
        });
    
        if (!post) {
            throw new Error("Blog post not found");
        }
    
        return post;
    }

    // Update a blog post
    public async updateBlogPost(
        id: string,
        userId: string,
        data: {
            title?: string;
            slug?: string;
            content?: string;
            excerpt?: string | null;
            thumbnail?: string | null;
            status?: BlogStatus;
            readTime?: number | null;
            publishedAt?: string | null;
            categoryIds?: string[];
        }
    ) {
        const post = await this.prisma.blogPost.findUnique({
            where: { id },
            include: {
                categories: true
            }
        });

        if (!post) {
            throw new Error("Blog post not found");
        }

        // Check if the user is the author of the post
        if (post.userId !== userId) {
            throw new Error("Unauthorized: You can only update your own posts");
        }

        // Check if slug is being updated and if it already exists
        if (data.slug && data.slug !== post.slug) {
            const existingPost = await this.prisma.blogPost.findUnique({
                where: { slug: data.slug }
            });

            if (existingPost) {
                throw new Error("Blog post with this slug already exists");
            }
        }

        // Create a clean update data object without categoryIds
        const { categoryIds, ...updateData } = data;

        // Handle published date if status is being updated to PUBLISHED
        const updatedData: BlogPostUpdateData = {
            ...updateData,
            publishedAt: updateData.publishedAt ? new Date(updateData.publishedAt) : undefined
        };

        if (data.status === BlogStatus.PUBLISHED && post.status !== BlogStatus.PUBLISHED) {
            updatedData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
        }

        // Handle category updates if provided
        if (categoryIds) {
            if (categoryIds.length > 0) {
                const categories = await this.prisma.blogCategory.findMany({
                    where: {
                        id: {
                            in: categoryIds
                        }
                    }
                });

                if (categories.length !== categoryIds.length) {
                    throw new Error("One or more categories not found");
                }
            }

            updatedData.categories = {
                set: [], // Disconnect all existing categories
                connect: categoryIds.map(id => ({ id }))
            };
        }

        const updatedPost = await this.prisma.blogPost.update({
            where: { id },
            data: updatedData,
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return updatedPost;
    }

    // Delete a blog post
    public async deleteBlogPost(id: string, userId: string) {
        const post = await this.prisma.blogPost.findUnique({
            where: { id }
        });

        if (!post) {
            throw new Error("Blog post not found");
        }

        // Check if the user is the author of the post
        if (post.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own posts");
        }

        await this.prisma.blogPost.delete({
            where: { id }
        });

        return { id };
    }

    // Admin method to delete any blog post
    public async adminDeleteBlogPost(id: string) {
        const post = await this.prisma.blogPost.findUnique({
            where: { id }
        });

        if (!post) {
            throw new Error("Blog post not found");
        }

        await this.prisma.blogPost.delete({
            where: { id }
        });

        return { id };
    }

    // Get blog statistics for admin dashboard
    public async getBlogStatistics() {
        // Total number of posts
        const totalPosts = await this.prisma.blogPost.count();

        // Posts by status
        const publishedPosts = await this.prisma.blogPost.count({
            where: { status: BlogStatus.PUBLISHED }
        });

        const draftPosts = await this.prisma.blogPost.count({
            where: { status: BlogStatus.DRAFT }
        });

        // Most active authors (top 5)
        const topAuthors = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: { BlogPost: true }
                }
            },
            orderBy: {
                BlogPost: { _count: 'desc' }
            },
            take: 5
        });

        // Posts per category
        const categories = await this.prisma.blogCategory.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: {
                posts: { _count: 'desc' }
            }
        });

        // Posts created in the last 7 days
        const lastWeekPosts = await this.prisma.blogPost.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Posts created in the last 30 days
        const lastMonthPosts = await this.prisma.blogPost.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent posts with activity (last 5 created or updated)
        const recentPosts = await this.prisma.blogPost.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        // Posts without categories
        const postsWithoutCategories = await this.prisma.blogPost.count({
            where: {
                categories: {
                    none: {}
                }
            }
        });

        // Average posts per user (users who have at least one post)
        const usersWithPosts = await this.prisma.user.count({
            where: {
                BlogPost: {
                    some: {}
                }
            }
        });

        const averagePostsPerUser = usersWithPosts > 0
            ? totalPosts / usersWithPosts
            : 0;

        return {
            totalPosts,
            postsByStatus: {
                published: publishedPosts,
                draft: draftPosts
            },
            topAuthors: topAuthors.map(author => ({
                id: author.id,
                name: `${author.firstName} ${author.lastName}`,
                postCount: author._count.BlogPost
            })),
            categoriesDistribution: categories.map(category => ({
                id: category.id,
                name: category.name,
                postCount: category._count.posts
            })),
            recentActivity: {
                lastWeekPosts,
                lastMonthPosts,
                recentPosts
            },
            metadata: {
                postsWithoutCategories,
                averagePostsPerUser: parseFloat(averagePostsPerUser.toFixed(2))
            }
        };
    }
}