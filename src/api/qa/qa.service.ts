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

    //  **** Answer methods **** //

    // Create a new answer
    public async createAnswer(data: { content: string, questionId: string }, userId: string) {
        // Check if the question exists
        const question = await this.prisma.question.findUnique({
            where: { id: data.questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        // Create the answer
        const answer = await this.prisma.answer.create({
            data: {
                content: data.content,
                user: { connect: { id: userId } },
                question: { connect: { id: data.questionId } }
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

    // Get answers with pagination and filters
    public async getAnswers(params: {
        page?: number;
        limit?: number;
        questionId?: string;
        userId?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            questionId,
            userId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: Prisma.AnswerWhereInput = {};

        if (questionId) {
            where.questionId = questionId;
        }

        if (userId) {
            where.userId = userId;
        }

        // Get total count for pagination
        const totalAnswers = await this.prisma.answer.count({ where });

        // Get answers
        const answers = await this.prisma.answer.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc'
            },
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
            }
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalAnswers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            answers,
            pagination: {
                totalAnswers,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    // Get answers by ID
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
                question: {
                    select: {
                        id: true,
                        title: true,
                        userId: true
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

    // Update answer
    public async updateAnswer(id: string, userId: string, content: string) {
        // Check if answer exists and belongs to user
        const answer = await this.prisma.answer.findUnique({
            where: { id }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        if (answer.userId !== userId) {
            throw new Error("You can only update your own answers");
        }

        // Update the answer
        const updatedAnswer = await this.prisma.answer.update({
            where: { id },
            data: { content },
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

    // Delete answer
    public async deleteAnswer(id: string, userId: string, isAdmin: boolean) {
        // Check if answer exists
        const answer = await this.prisma.answer.findUnique({
            where: { id }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        // Only the author or admin can delete
        if (answer.userId !== userId && !isAdmin) {
            throw new Error("You can only delete your own answers");
        }

        // Delete the answer
        await this.prisma.answer.delete({
            where: { id }
        });

        return { id };
    }

    // Vote on answer (upvote or downvote)
    public async voteAnswer(userId: string, answerId: string, voteType: 'UPVOTE' | 'DOWNVOTE') {
        // Check if answer exists
        const answer = await this.prisma.answer.findUnique({
            where: { id: answerId }
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        // Check if user has already voted on this answer
        const existingVote = await this.prisma.answerVote.findUnique({
            where: {
                userId_answerId: {
                    userId,
                    answerId
                }
            }
        });

        // Begin transaction to ensure vote counts are updated atomically
        return await this.prisma.$transaction(async (prisma) => {
            // If the user has already voted
            if (existingVote) {
                // If the same vote type, remove the vote (toggle)
                if (existingVote.type === voteType) {
                    await prisma.answerVote.delete({
                        where: {
                            userId_answerId: {
                                userId,
                                answerId
                            }
                        }
                    });

                    // Update answer vote counts
                    if (voteType === 'UPVOTE') {
                        await prisma.answer.update({
                            where: { id: answerId },
                            data: {
                                upvotes: {
                                    decrement: 1
                                }
                            }
                        });
                    } else {
                        await prisma.answer.update({
                            where: { id: answerId },
                            data: {
                                downvotes: {
                                    decrement: 1
                                }
                            }
                        });
                    }

                    return {
                        action: 'removed',
                        voteType
                    };
                }
                // If different vote type, change the vote
                else {
                    await prisma.answerVote.update({
                        where: {
                            userId_answerId: {
                                userId,
                                answerId
                            }
                        },
                        data: {
                            type: voteType
                        }
                    });

                    // Update answer vote counts (increment new vote type, decrement old vote type)
                    if (voteType === 'UPVOTE') {
                        await prisma.answer.update({
                            where: { id: answerId },
                            data: {
                                upvotes: {
                                    increment: 1
                                },
                                downvotes: {
                                    decrement: 1
                                }
                            }
                        });
                    } else {
                        await prisma.answer.update({
                            where: { id: answerId },
                            data: {
                                downvotes: {
                                    increment: 1
                                },
                                upvotes: {
                                    decrement: 1
                                }
                            }
                        });
                    }

                    return {
                        action: 'changed',
                        voteType
                    };
                }
            }
            // If no existing vote, create a new vote
            else {
                await prisma.answerVote.create({
                    data: {
                        type: voteType,
                        user: { connect: { id: userId } },
                        answer: { connect: { id: answerId } }
                    }
                });

                // Update answer vote counts
                if (voteType === 'UPVOTE') {
                    await prisma.answer.update({
                        where: { id: answerId },
                        data: {
                            upvotes: {
                                increment: 1
                            }
                        }
                    });
                } else {
                    await prisma.answer.update({
                        where: { id: answerId },
                        data: {
                            downvotes: {
                                increment: 1
                            }
                        }
                    });
                }

                return {
                    action: 'added',
                    voteType
                };
            }
        });
    }

    // Accept an answer for a question
    public async acceptAnswer(questionId: string, answerId: string, userId: string) {
        // Check if question exists and belongs to the user
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        if (question.userId !== userId) {
            throw new Error("Only the question author can accept an answer");
        }

        // Check if answer exists and belongs to the question
        const answer = await this.prisma.answer.findUnique({
            where: {
                id: answerId,
                questionId: questionId
            }
        });

        if (!answer) {
            throw new Error("Answer not found or does not belong to this question");
        }

        // Begin transaction to handle accepting answer
        return await this.prisma.$transaction(async (prisma) => {
            // If there's a previously accepted answer, un-accept it
            if (question.acceptedAnswerId) {
                await prisma.answer.update({
                    where: { id: question.acceptedAnswerId },
                    data: { isAccepted: false }
                });
            }

            // Accept this answer
            const updatedAnswer = await prisma.answer.update({
                where: { id: answerId },
                data: { isAccepted: true },
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

            // Update the question with the accepted answer ID
            await prisma.question.update({
                where: { id: questionId },
                data: {
                    acceptedAnswerId: answerId,
                    status: 'CLOSED'
                }
            });

            return updatedAnswer;
        });
    }

    // Unaccept an answer
    public async unacceptAnswer(questionId: string, answerId: string, userId: string) {
        // Check if question exists and belongs to the user
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new Error("Question not found");
        }

        if (question.userId !== userId) {
            throw new Error("Only the question author can unaccept an answer");
        }

        // Check if this answer is currently the accepted one
        if (question.acceptedAnswerId !== answerId) {
            throw new Error("This answer is not currently accepted");
        }

        // Begin transaction to handle unaccepting answer
        return await this.prisma.$transaction(async (prisma) => {
            // Unaccept this answer
            const updatedAnswer = await prisma.answer.update({
                where: { id: answerId },
                data: { isAccepted: false },
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

            // Update the question to remove the accepted answer ID
            await prisma.question.update({
                where: { id: questionId },
                data: {
                    acceptedAnswerId: null,
                    status: 'OPEN'
                }
            });

            return updatedAnswer;
        });
    }

    // Get user's votes for a specific question's answers (to show which answers the user has voted on)
    public async getUserVotes(userId: string, questionId?: string, answerId?: string) {
        const where: Prisma.AnswerVoteWhereInput = { userId };

        if (questionId) {
            where.answer = { questionId };
        }

        if (answerId) {
            where.answerId = answerId;
        }

        const votes = await this.prisma.answerVote.findMany({
            where,
            select: {
                answerId: true,
                type: true
            }
        });

        // Transform to a more usable format
        const voteMap: Record<string, 'UPVOTE' | 'DOWNVOTE'> = {};
        votes.forEach(vote => {
            voteMap[vote.answerId] = vote.type;
        });

        return voteMap;
    }

    // Get Q&A statistics for admin dashboard
    public async getQAStatistics() {
        // Total counts
        const totalQuestions = await this.prisma.question.count();
        const totalAnswers = await this.prisma.answer.count();
        const totalTags = await this.prisma.tag.count();

        // Questions by status
        const openQuestions = await this.prisma.question.count({
            where: { status: QuestionStatus.OPEN }
        });

        const closedQuestions = await this.prisma.question.count({
            where: { status: QuestionStatus.CLOSED }
        });

        // Most active users (top 5 question askers)
        const topQuestionAskers = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: { Question: true }
                }
            },
            orderBy: {
                Question: { _count: 'desc' }
            },
            take: 5
        });

        // Most active answerers (top 5)
        const topAnswerers = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                _count: {
                    select: { Answer: true }
                }
            },
            orderBy: {
                Answer: { _count: 'desc' }
            },
            take: 5
        });

        // Most used tags (top 10)
        const popularTags = await this.prisma.tag.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                questions: { _count: 'desc' }
            },
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

        // Answers created in the last 7 days
        const lastWeekAnswers = await this.prisma.answer.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Answers created in the last 30 days
        const lastMonthAnswers = await this.prisma.answer.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Recent activity (last 5 questions and answers)
        const recentQuestions = await this.prisma.question.findMany({
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

        const recentAnswers = await this.prisma.answer.findMany({
            select: {
                id: true,
                content: true,
                isAccepted: true,
                upvotes: true,
                downvotes: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                question: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        // Questions without answers
        const questionsWithoutAnswers = await this.prisma.question.count({
            where: {
                answers: {
                    none: {}
                }
            }
        });

        // Questions without accepted answers (but have some answers)
        const questionsWithoutAcceptedAnswers = await this.prisma.question.count({
            where: {
                acceptedAnswerId: null,
                answers: {
                    some: {}
                }
            }
        });

        // Average answers per question
        const averageAnswersPerQuestion = totalQuestions > 0
            ? (await this.prisma.answer.count()) / totalQuestions
            : 0;

        // Most voted answers (top 5)
        const mostUpvotedAnswers = await this.prisma.answer.findMany({
            select: {
                id: true,
                content: true,
                upvotes: true,
                downvotes: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                question: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: { upvotes: 'desc' },
            take: 5
        });

        return {
            totalCounts: {
                questions: totalQuestions,
                answers: totalAnswers,
                tags: totalTags
            },
            questionsByStatus: {
                open: openQuestions,
                closed: closedQuestions
            },
            userActivity: {
                topQuestionAskers: topQuestionAskers.map(user => ({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    questionCount: user._count.Question
                })),
                topAnswerers: topAnswerers.map(user => ({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    answerCount: user._count.Answer
                }))
            },
            tagDistribution: popularTags.map(tag => ({
                id: tag.id,
                name: tag.name,
                questionCount: tag._count.questions
            })),
            recentActivity: {
                lastWeekQuestions,
                lastMonthQuestions,
                lastWeekAnswers,
                lastMonthAnswers,
                recentQuestions,
                recentAnswers
            },
            metrics: {
                questionsWithoutAnswers,
                questionsWithoutAcceptedAnswers,
                averageAnswersPerQuestion: parseFloat(averageAnswersPerQuestion.toFixed(2)),
                mostUpvotedAnswers
            }
        };
    }
}
