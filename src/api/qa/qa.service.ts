import { Prisma, PrismaClient, QuestionStatus } from "@prisma/client";

export class QAService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    //  **** Tag methods **** //

    // Create a new tag (admin only)
    public async createTag(name: string) {
        const existingTag = await this.prisma.tag.findUnique({
            where: { name }
        });

        if (existingTag) {
            throw new Error("Tag with this name already exists");
        }

        const tag = await this.prisma.tag.create({
            data: { name }
        });

        return tag;
    }

    // Get all tags
    public async getTags() {
        const tags = await this.prisma.tag.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
            questionCount: tag._count.questions
        }));
    }

    // Delete a tag (admin only)
    public async deleteTag(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });

        if (!tag) {
            throw new Error("Tag not found");
        }

        if (tag._count.questions > 0) {
            throw new Error("Cannot delete tag that is associated with questions");
        }

        await this.prisma.tag.delete({
            where: { id }
        });

        return { id };
    }

    //  **** Question methods **** //

    // Create a new question
    public async createQuestion(data: { title: string, slug: string, content: string, tags: string[] }, userId: string) {
        const slug = data.slug

        // Check if slug already exists
        const existingQuestion = await this.prisma.question.findUnique({
            where: { slug }
        });
        if (existingQuestion) {
            throw new Error("A question with similar title already exists");
        }

        // Create the question
        const question = await this.prisma.question.create({
            data: {
                title: data.title,
                content: data.content,
                slug,
                user: { connect: { id: userId } },
                tags: {
                    connect: data.tags.map(tagId => ({ id: tagId }))
                }
            },
            include: {
                tags: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        return question;
    }

    // Get questions with pagination and filters
    public async getQuestions(params: {
        page?: number;
        limit?: number;
        status?: string;
        tagId?: string;
        userId?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            status,
            tagId,
            userId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: Prisma.QuestionWhereInput = {};

        if (status) {
            where.status = status as QuestionStatus;
        }

        if (userId) {
            where.userId = userId;
        }

        if (tagId) {
            where.tags = {
                some: {
                    id: tagId
                }
            };
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination
        const totalQuestions = await this.prisma.question.count({ where });

        // Get questions
        const questions = await this.prisma.question.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tags: true,
                _count: {
                    select: {
                        answers: true
                    }
                }
            }
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalQuestions / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            questions,
            pagination: {
                totalQuestions,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    // Get question by ID or slug
    public async getQuestionByIdOrSlug(idOrSlug: string) {
        const question = await this.prisma.question.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tags: true,
                answers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        _count: {
                            select: {
                                votes: true
                            }
                        }
                    },
                    orderBy: [
                        { isAccepted: 'desc' },
                        { upvotes: 'desc' },
                        { createdAt: 'desc' }
                    ]
                }
            }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        return question;
    }

    // Update question
    public async updateQuestion(id: string, userId: string, data: {
        title?: string;
        content?: string;
        status?: string;
        tags?: string[];
    }) {
        const question = await this.prisma.question.findUnique({
            where: { id },
            include: { tags: true }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        if (question.userId !== userId) {
            throw new Error("You can only update your own questions");
        }

        // Update the question - slug remains unchanged
        const updateData: Prisma.QuestionUpdateInput = {
            ...(data.title && { title: data.title }),
            ...(data.content && { content: data.content }),
            ...(data.status && { status: data.status as QuestionStatus }),
        };

        // Update tags if provided
        if (data.tags && data.tags.length > 0) {
            // Disconnect current tags and connect new ones
            const updatedQuestion = await this.prisma.question.update({
                where: { id },
                data: {
                    ...updateData,
                    tags: {
                        disconnect: question.tags.map(tag => ({ id: tag.id })),
                        connect: data.tags.map(tagId => ({ id: tagId }))
                    }
                },
                include: {
                    tags: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            });

            return updatedQuestion;
        }

        // Update without changing tags
        const updatedQuestion = await this.prisma.question.update({
            where: { id },
            data: updateData,
            include: {
                tags: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        return updatedQuestion;
    }

    // Delete question
    public async deleteQuestion(id: string, userId: string, isAdmin: boolean) {
        // Check if question exists
        const question = await this.prisma.question.findUnique({
            where: { id }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        // Only the author or admin can delete
        if (question.userId !== userId && !isAdmin) {
            throw new Error("You can only delete your own questions");
        }

        // Delete the question
        await this.prisma.question.delete({
            where: { id }
        });

        return { id };
    }
}
