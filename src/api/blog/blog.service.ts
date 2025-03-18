import { PrismaClient, BlogStatus } from "@prisma/client";

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

        // Handle published date
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

        // Build where clause
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

        // Add search functionality
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
        // Check if the parameter is a slug or an id
        const isSlug = !idOrSlug.includes('-');

        const post = await this.prisma.blogPost.findFirst({
            where: isSlug
                ? { id: idOrSlug }
                : { slug: idOrSlug },
            include: {
                categories: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!post) {
            throw new Error("Blog post not found");
        }

        return post;
    }
}