import { PrismaClient, QuestionStatus, VoteType } from '@prisma/client';

export interface QuestionQueryOptions {
    page?: number;
    limit?: number;
    status?: QuestionStatus;
    tagId?: string;
    userId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class QAService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // ------------------- Question Operations -------------------

    // Create a new question
    public async createQuestion(
        userId: string,
        title: string,
        content: string,
        tagIds: string[] = []
    ) {
        // Validate that the tags exist if provided
        if (tagIds.length > 0) {
            const tags = await this.prisma.tag.findMany({
                where: {
                    id: {
                        in: tagIds
                    }
                }
            });

            if (tags.length !== tagIds.length) {
                throw new Error("One or more tags not found");
            }
        }

        const question = await this.prisma.question.create({
            data: {
                title,
                content,
                userId,
                tags: {
                    connect: tagIds.map(id => ({ id }))
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tags: true
            }
        });

        return question;
    }

    // Get questions with filters and pagination
    public async getQuestions(options: QuestionQueryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            tagId,
            userId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        const where: any = {};

        // Filter by status if provided
        if (status) {
            where.status = status;
        }

        // Filter by user if provided
        if (userId) {
            where.userId = userId;
        }

        // Filter by tag if provided
        if (tagId) {
            where.tags = {
                some: {
                    id: tagId
                }
            };
        }

        // Search functionality
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination
        const totalCount = await this.prisma.question.count({ where });

        // Get questions with filtering, sorting and pagination
        const questions = await this.prisma.question.findMany({
            where,
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
                        answers: true,
                        votes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        return {
            questions,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages,
                hasMore: page < totalPages
            }
        };
    }

    // Get questions by user ID
    public async getUserQuestions(userId: string, options: QuestionQueryOptions = {}) {
        return await this.getQuestions({
            ...options,
            userId
        });
    }

    // Get a question by ID
    public async getQuestionById(id: string) {
        const question = await this.prisma.question.findUnique({
            where: { id },
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
                                votes: true,
                                comments: true
                            }
                        }
                    },
                    orderBy: {
                        isAccepted: 'desc'
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        votes: true
                    }
                }
            }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        return question;
    }

    // Update a question
    public async updateQuestion(
        id: string,
        userId: string,
        data: {
            title?: string;
            content?: string;
            status?: QuestionStatus;
            tags?: string[];
        }
    ) {
        const question = await this.prisma.question.findUnique({
            where: { id },
            include: {
                tags: true
            }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        // Check if the user is the author of the question
        if (question.userId !== userId) {
            throw new Error("Unauthorized: You can only update your own questions");
        }

        // Create a clean update data object without tags
        const { tags: tagIds, ...updateData } = data;

        // Handle tag updates if provided
        if (tagIds) {
            // Validate that the tags exist
            if (tagIds.length > 0) {
                const tags = await this.prisma.tag.findMany({
                    where: {
                        id: {
                            in: tagIds
                        }
                    }
                });

                if (tags.length !== tagIds.length) {
                    throw new Error("One or more tags not found");
                }
            }
        }

        const updatedQuestion = await this.prisma.question.update({
            where: { id },
            data: {
                ...updateData,
                // Handle tag updates if provided
                ...(tagIds && {
                    tags: {
                        set: [], // Disconnect all existing tags
                        connect: tagIds.map(id => ({ id }))
                    }
                })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tags: true
            }
        });

        return updatedQuestion;
    }

    // Delete a question
    public async deleteQuestion(id: string, userId: string) {
        const question = await this.prisma.question.findUnique({
            where: { id }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        // Check if the user is the author of the question
        if (question.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own questions");
        }

        await this.prisma.question.delete({
            where: { id }
        });

        return { id };
    }

    // Admin method to delete any question
    public async adminDeleteQuestion(id: string) {
        const question = await this.prisma.question.findUnique({
            where: { id }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        await this.prisma.question.delete({
            where: { id }
        });

        return { id };
    }

    // ------------------- Answer Operations -------------------

    // Create a new answer
    public async createAnswer(
        userId: string,
        questionId: string,
        content: string
    ) {
        // Check if the question exists
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        const answer = await this.prisma.answer.create({
            data: {
                content,
                userId,
                questionId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return answer;
    }

    // Get an answer by ID
    public async getAnswerById(id: string) {
        const answer = await this.prisma.answer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        votes: true
                    }
                }
            }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        return answer;
    }

    // Update an answer
    public async updateAnswer(
        id: string,
        userId: string,
        content: string
    ) {
        const answer = await this.prisma.answer.findUnique({
            where: { id }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        // Check if the user is the author of the answer
        if (answer.userId !== userId) {
            throw new Error("Unauthorized: You can only update your own answers");
        }

        const updatedAnswer = await this.prisma.answer.update({
            where: { id },
            data: {
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return updatedAnswer;
    }

    // Delete an answer
    public async deleteAnswer(id: string, userId: string) {
        const answer = await this.prisma.answer.findUnique({
            where: { id }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        // Check if the user is the author of the answer
        if (answer.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own answers");
        }

        await this.prisma.answer.delete({
            where: { id }
        });

        return { id };
    }

    // Admin method to delete any answer
    public async adminDeleteAnswer(id: string) {
        const answer = await this.prisma.answer.findUnique({
            where: { id }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        await this.prisma.answer.delete({
            where: { id }
        });

        return { id };
    }

    // Accept an answer
    public async acceptAnswer(questionId: string, answerId: string, userId: string) {
        // Check if the question exists and belongs to the user
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        if (question.userId !== userId) {
            throw new Error("Unauthorized: Only the question author can accept an answer");
        }

        // Check if the answer exists and belongs to the question
        const answer = await this.prisma.answer.findUnique({
            where: {
                id: answerId,
                questionId
            }
        });

        if (!answer) {
            throw new Error("Answer not found or does not belong to this question");
        }

        // Reset all answers for this question to not accepted
        await this.prisma.answer.updateMany({
            where: {
                questionId,
                isAccepted: true
            },
            data: {
                isAccepted: false
            }
        });

        // Set the provided answer as accepted
        const acceptedAnswer = await this.prisma.answer.update({
            where: { id: answerId },
            data: {
                isAccepted: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Update the question's acceptedAnswerId
        await this.prisma.question.update({
            where: { id: questionId },
            data: {
                acceptedAnswerId: answerId,
                status: QuestionStatus.CLOSED
            }
        });

        return acceptedAnswer;
    }

    // ------------------- Comment Operations -------------------

    // Create a question comment
    public async createQuestionComment(
        userId: string,
        questionId: string,
        content: string
    ) {
        // Check if the question exists
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        const comment = await this.prisma.questionComment.create({
            data: {
                content,
                userId,
                questionId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return comment;
    }

    // Delete a question comment
    public async deleteQuestionComment(id: string, userId: string) {
        const comment = await this.prisma.questionComment.findUnique({
            where: { id }
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        // Check if the user is the author of the comment
        if (comment.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own comments");
        }

        await this.prisma.questionComment.delete({
            where: { id }
        });

        return { id };
    }

    // Admin method to delete any question comment
    public async adminDeleteQuestionComment(id: string) {
        const comment = await this.prisma.questionComment.findUnique({
            where: { id }
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        await this.prisma.questionComment.delete({
            where: { id }
        });

        return { id };
    }

    // Create an answer comment
    public async createAnswerComment(
        userId: string,
        answerId: string,
        content: string
    ) {
        // Check if the answer exists
        const answer = await this.prisma.answer.findUnique({
            where: { id: answerId }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        const comment = await this.prisma.answerComment.create({
            data: {
                content,
                userId,
                answerId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return comment;
    }

    // Delete an answer comment
    public async deleteAnswerComment(id: string, userId: string) {
        const comment = await this.prisma.answerComment.findUnique({
            where: { id }
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        // Check if the user is the author of the comment
        if (comment.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own comments");
        }

        await this.prisma.answerComment.delete({
            where: { id }
        });

        return { id };
    }

    // Admin method to delete any answer comment
    public async adminDeleteAnswerComment(id: string) {
        const comment = await this.prisma.answerComment.findUnique({
            where: { id }
        });

        if (!comment) {
            throw new Error("Comment not found");
        }

        await this.prisma.answerComment.delete({
            where: { id }
        });

        return { id };
    }

    // ------------------- Vote Operations -------------------

    // Vote on a question
    public async voteQuestion(
        userId: string,
        questionId: string,
        type: VoteType
    ) {
        // Check if the question exists
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        // Check if the user has already voted on this question
        const existingVote = await this.prisma.questionVote.findUnique({
            where: {
                userId_questionId: {
                    userId,
                    questionId
                }
            }
        });

        // If a vote exists and it's the same type, remove the vote (toggle off)
        if (existingVote && existingVote.type === type) {
            await this.prisma.questionVote.delete({
                where: {
                    userId_questionId: {
                        userId,
                        questionId
                    }
                }
            });

            return {
                action: 'removed',
                type
            };
        }

        // If a vote exists but with a different type, update it
        if (existingVote) {
            await this.prisma.questionVote.update({
                where: {
                    userId_questionId: {
                        userId,
                        questionId
                    }
                },
                data: {
                    type
                }
            });

            return {
                action: 'updated',
                type
            };
        }

        // Otherwise, create a new vote
        await this.prisma.questionVote.create({
            data: {
                userId,
                questionId,
                type
            }
        });

        return {
            action: 'added',
            type
        };
    }

    // Vote on an answer
    public async voteAnswer(
        userId: string,
        answerId: string,
        type: VoteType
    ) {
        // Check if the answer exists
        const answer = await this.prisma.answer.findUnique({
            where: { id: answerId }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        // Check if the user has already voted on this answer
        const existingVote = await this.prisma.answerVote.findUnique({
            where: {
                userId_answerId: {
                    userId,
                    answerId
                }
            }
        });

        // If a vote exists and it's the same type, remove the vote (toggle off)
        if (existingVote && existingVote.type === type) {
            await this.prisma.answerVote.delete({
                where: {
                    userId_answerId: {
                        userId,
                        answerId
                    }
                }
            });

            return {
                action: 'removed',
                type
            };
        }

        // If a vote exists but with a different type, update it
        if (existingVote) {
            await this.prisma.answerVote.update({
                where: {
                    userId_answerId: {
                        userId,
                        answerId
                    }
                },
                data: {
                    type
                }
            });

            return {
                action: 'updated',
                type
            };
        }

        // Otherwise, create a new vote
        await this.prisma.answerVote.create({
            data: {
                userId,
                answerId,
                type
            }
        });

        return {
            action: 'added',
            type
        };
    }

    // ------------------- Tag Operations -------------------

    // Create a new tag
    public async createTag(name: string) {
        // Check if a tag with this name already exists
        const existingTag = await this.prisma.tag.findUnique({
            where: { name }
        });

        if (existingTag) {
            throw new Error("Tag with this name already exists");
        }

        const tag = await this.prisma.tag.create({
            data: {
                name
            }
        });

        return tag;
    }

    // Get all tags
    public async getTags() {
        const tags = await this.prisma.tag.findMany({
            include: {
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

        return tags;
    }

    // Get a tag by ID
    public async getTagById(id: string) {
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

        return tag;
    }

    // Get QA statistics for admin dashboard
    public async getQAStatistics() {
        // Total counts
        const totalQuestions = await this.prisma.question.count();
        const totalAnswers = await this.prisma.answer.count();
        const totalTags = await this.prisma.tag.count();

        // Status distribution
        const openQuestions = await this.prisma.question.count({
            where: { status: QuestionStatus.OPEN }
        });
        const closedQuestions = await this.prisma.question.count({
            where: { status: QuestionStatus.CLOSED }
        });

        // Questions with accepted answers
        const questionsWithAcceptedAnswers = await this.prisma.question.count({
            where: {
                acceptedAnswerId: {
                    not: null
                }
            }
        });

        // Top tags
        const topTags = await this.prisma.tag.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                questions: { _count: 'desc' }
            },
            take: 10
        });

        // Top contributors (users with most questions + answers)
        const topContributors = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: {
                        Question: true,
                        Answer: true
                    }
                }
            },
            orderBy: [
                {
                    Question: { _count: 'desc' }
                },
                {
                    Answer: { _count: 'desc' }
                }
            ],
            take: 10
        });

        // Questions created in the last 7 days
        const lastWeekQuestions = await this.prisma.question.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Questions created in the last 30 days
        const lastMonthQuestions = await this.prisma.question.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent questions with activity (last 5 created or updated)
        const recentQuestions = await this.prisma.question.findMany({
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        answers: true,
                        votes: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        });

        return {
            counts: {
                totalQuestions,
                totalAnswers,
                totalTags,
                questionsWithAcceptedAnswers
            },
            status: {
                open: openQuestions,
                closed: closedQuestions
            },
            topTags,
            topContributors,
            activity: {
                lastWeekQuestions,
                lastMonthQuestions,
                recentQuestions
            }
        };
    }
}
