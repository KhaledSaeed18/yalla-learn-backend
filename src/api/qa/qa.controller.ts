import { Request, Response, NextFunction } from "express";
import { QAService } from "./qa.service";
import { errorHandler } from "../../utils/errorHandler";

export default class QAController {
    private qaService: QAService;

    constructor() {
        this.qaService = new QAService();
        this.createTag = this.createTag.bind(this);
        this.getTags = this.getTags.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
        this.createQuestion = this.createQuestion.bind(this);
        this.getQuestions = this.getQuestions.bind(this);
        this.getQuestionByIdOrSlug = this.getQuestionByIdOrSlug.bind(this);
        this.getUserQuestions = this.getUserQuestions.bind(this);
        this.updateQuestion = this.updateQuestion.bind(this);
        this.deleteQuestion = this.deleteQuestion.bind(this);
        this.adminDeleteQuestion = this.adminDeleteQuestion.bind(this);
        this.createAnswer = this.createAnswer.bind(this);
        this.getAnswers = this.getAnswers.bind(this);
        this.getAnswerById = this.getAnswerById.bind(this);
        this.updateAnswer = this.updateAnswer.bind(this);
        this.deleteAnswer = this.deleteAnswer.bind(this);
        this.adminDeleteAnswer = this.adminDeleteAnswer.bind(this);
        this.voteAnswer = this.voteAnswer.bind(this);
        this.acceptAnswer = this.acceptAnswer.bind(this);
        this.unacceptAnswer = this.unacceptAnswer.bind(this);
        this.getUserVotes = this.getUserVotes.bind(this);
    }

    //  **** Tag methods **** //
    // Create a new tag (admin only)
    async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name } = req.body;

            const tag = await this.qaService.createTag(name);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Tag created successfully",
                data: { tag }
            });
        } catch (err) {
            if ((err as Error).message === "Tag with this name already exists") {
                next(errorHandler(409, "Tag with this name already exists"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create tag"));
        }
    }

    // Get all tags
    async getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tags = await this.qaService.getTags();

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Tags retrieved successfully",
                data: { tags }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve tags"));
        }
    }

    // Delete a tag (admin only)
    async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            await this.qaService.deleteTag(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Tag deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Tag not found") {
                next(errorHandler(404, "Tag not found"));
                return;
            }
            if ((err as Error).message === "Cannot delete tag that is associated with questions") {
                next(errorHandler(400, "Cannot delete tag that is associated with questions"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete tag"));
        }
    }

    //  **** Question methods **** //
    // Create a new question
    async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { title, slug, content, tags } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const question = await this.qaService.createQuestion({ title, slug, content, tags }, userId);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Question created successfully",
                data: { question }
            });
        } catch (err) {
            if ((err as Error).message === "A question with similar title already exists") {
                next(errorHandler(409, "A question with similar title already exists"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create question"));
        }
    }

    // Get all questions (with filters)
    async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { questions, pagination } = await this.qaService.getQuestions(req.query);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Questions retrieved successfully",
                data: { questions, pagination }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve questions"));
        }
    }

    // Get question by ID or slug
    async getQuestionByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idOrSlug } = req.params;
            const question = await this.qaService.getQuestionByIdOrSlug(idOrSlug);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Question retrieved successfully",
                data: { question }
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve question"));
        }
    }

    // Get questions for the authenticated user
    async getUserQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;
            const { questions, pagination } = await this.qaService.getQuestions({
                ...req.query,
                userId
            });

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Your questions retrieved successfully",
                data: { questions, pagination }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve your questions"));
        }
    }

    // Update question
    async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;
            const { title, content, status, tags } = req.body;

            const question = await this.qaService.updateQuestion(id, userId, {
                title, content, status, tags
            });

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Question updated successfully",
                data: { question }
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            if ((err as Error).message === "You can only update your own questions") {
                next(errorHandler(403, "You can only update your own questions"));
                return;
            }
            if ((err as Error).message === "A question with similar title already exists") {
                next(errorHandler(409, "A question with similar title already exists"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update question"));
        }
    }

    // Delete question
    async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;
            const isAdmin = req.user.role === 'ADMIN';

            await this.qaService.deleteQuestion(id, userId, isAdmin);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Question deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            if ((err as Error).message === "You can only delete your own questions") {
                next(errorHandler(403, "You can only delete your own questions"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete question"));
        }
    }

    // Admin method to delete any question
    async adminDeleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            await this.qaService.deleteQuestion(id, req.user.id, true);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Question deleted successfully by admin"
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete question"));
        }
    }

    //  **** Answer methods **** //
    // Create a new answer
    async createAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { content, questionId } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const answer = await this.qaService.createAnswer({ content, questionId }, userId);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Answer created successfully",
                data: { answer }
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create answer"));
        }
    }

    // Get all answers (with filters)
    async getAnswers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { answers, pagination } = await this.qaService.getAnswers(req.query);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answers retrieved successfully",
                data: { answers, pagination }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve answers"));
        }
    }

    // Get answer by ID
    async getAnswerById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const answer = await this.qaService.getAnswerById(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer retrieved successfully",
                data: { answer }
            });
        } catch (err) {
            if ((err as Error).message === "Answer not found") {
                next(errorHandler(404, "Answer not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve answer"));
        }
    }

    // Update answer
    async updateAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { content } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const answer = await this.qaService.updateAnswer(id, userId, content);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer updated successfully",
                data: { answer }
            });
        } catch (err) {
            if ((err as Error).message === "Answer not found") {
                next(errorHandler(404, "Answer not found"));
                return;
            }
            if ((err as Error).message === "You can only update your own answers") {
                next(errorHandler(403, "You can only update your own answers"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update answer"));
        }
    }

    // Delete answer
    async deleteAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;
            const isAdmin = req.user.role === 'ADMIN';

            await this.qaService.deleteAnswer(id, userId, isAdmin);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Answer not found") {
                next(errorHandler(404, "Answer not found"));
                return;
            }
            if ((err as Error).message === "You can only delete your own answers") {
                next(errorHandler(403, "You can only delete your own answers"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete answer"));
        }
    }

    // Admin method to delete any answer
    async adminDeleteAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            await this.qaService.deleteAnswer(id, req.user.id, true);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer deleted successfully by admin"
            });
        } catch (err) {
            if ((err as Error).message === "Answer not found") {
                next(errorHandler(404, "Answer not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete answer"));
        }
    }

    // Vote on answer
    async voteAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { answerId, type } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const result = await this.qaService.voteAnswer(userId, answerId, type);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: `Vote ${result.action} successfully`,
                data: result
            });
        } catch (err) {
            if ((err as Error).message === "Answer not found") {
                next(errorHandler(404, "Answer not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to vote on answer"));
        }
    }

    // Accept an answer
    async acceptAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { questionId, answerId } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const answer = await this.qaService.acceptAnswer(questionId, answerId, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer accepted successfully",
                data: { answer }
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            if ((err as Error).message === "Answer not found or does not belong to this question") {
                next(errorHandler(404, "Answer not found or does not belong to this question"));
                return;
            }
            if ((err as Error).message === "Only the question author can accept an answer") {
                next(errorHandler(403, "Only the question author can accept an answer"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to accept answer"));
        }
    }

    // Unaccept an answer
    async unacceptAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { questionId, answerId } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;

            const answer = await this.qaService.unacceptAnswer(questionId, answerId, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Answer unaccepted successfully",
                data: { answer }
            });
        } catch (err) {
            if ((err as Error).message === "Question not found") {
                next(errorHandler(404, "Question not found"));
                return;
            }
            if ((err as Error).message === "This answer is not currently accepted") {
                next(errorHandler(400, "This answer is not currently accepted"));
                return;
            }
            if ((err as Error).message === "Only the question author can unaccept an answer") {
                next(errorHandler(403, "Only the question author can unaccept an answer"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to unaccept answer"));
        }
    }

    // Get user's votes
    async getUserVotes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.id;
            const { questionId, answerId } = req.query as { questionId?: string, answerId?: string };

            const votes = await this.qaService.getUserVotes(userId, questionId, answerId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "User votes retrieved successfully",
                data: { votes }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve user votes"));
        }
    }
}