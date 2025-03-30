import { Request, Response, NextFunction } from 'express';
import { QAService } from './qa.service';
import { errorHandler } from '../../utils/errorHandler';
import { Role } from '@prisma/client';

export class QAController {
    private qaService: QAService;

    constructor() {
        this.qaService = new QAService();
    }

    // ------------------- Question Operations -------------------

    public createQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, content, tags } = req.body;
            const userId = req.user.id;

            const question = await this.qaService.createQuestion(userId, title, content, tags);

            res.status(201).json({
                success: true,
                message: 'Question created successfully',
                data: question
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getQuestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.qaService.getQuestions(req.query);

            res.status(200).json({
                success: true,
                message: 'Questions retrieved successfully',
                data: result.questions,
                pagination: result.pagination
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getUserQuestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.userId || req.user.id;
            const result = await this.qaService.getUserQuestions(userId, req.query);

            res.status(200).json({
                success: true,
                message: 'User questions retrieved successfully',
                data: result.questions,
                pagination: result.pagination
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getQuestionById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const question = await this.qaService.getQuestionById(id);

            res.status(200).json({
                success: true,
                message: 'Question retrieved successfully',
                data: question
            });
        } catch (error) {
            next(errorHandler(404, error.message));
        }
    };

    public updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { title, content, status, tags } = req.body;

            const question = await this.qaService.updateQuestion(id, userId, {
                title,
                content,
                status,
                tags
            });

            res.status(200).json({
                success: true,
                message: 'Question updated successfully',
                data: question
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await this.qaService.deleteQuestion(id, userId);

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully'
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public adminDeleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const { id } = req.params;
            await this.qaService.adminDeleteQuestion(id);

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully by admin'
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    // ------------------- Answer Operations -------------------

    public createAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { content, questionId } = req.body;
            const userId = req.user.id;

            const answer = await this.qaService.createAnswer(userId, questionId, content);

            res.status(201).json({
                success: true,
                message: 'Answer created successfully',
                data: answer
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getAnswerById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const answer = await this.qaService.getAnswerById(id);

            res.status(200).json({
                success: true,
                message: 'Answer retrieved successfully',
                data: answer
            });
        } catch (error) {
            next(errorHandler(404, error.message));
        }
    };

    public updateAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const answer = await this.qaService.updateAnswer(id, userId, content);

            res.status(200).json({
                success: true,
                message: 'Answer updated successfully',
                data: answer
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public deleteAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await this.qaService.deleteAnswer(id, userId);

            res.status(200).json({
                success: true,
                message: 'Answer deleted successfully'
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public adminDeleteAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const { id } = req.params;
            await this.qaService.adminDeleteAnswer(id);

            res.status(200).json({
                success: true,
                message: 'Answer deleted successfully by admin'
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public acceptAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { questionId, answerId } = req.body;
            const userId = req.user.id;

            const answer = await this.qaService.acceptAnswer(questionId, answerId, userId);

            res.status(200).json({
                success: true,
                message: 'Answer accepted successfully',
                data: answer
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    // ------------------- Comment Operations -------------------

    public createQuestionComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { content, questionId } = req.body;
            const userId = req.user.id;

            const comment = await this.qaService.createQuestionComment(userId, questionId, content);

            res.status(201).json({
                success: true,
                message: 'Comment created successfully',
                data: comment
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public deleteQuestionComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await this.qaService.deleteQuestionComment(id, userId);

            res.status(200).json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public adminDeleteQuestionComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const { id } = req.params;
            await this.qaService.adminDeleteQuestionComment(id);

            res.status(200).json({
                success: true,
                message: 'Comment deleted successfully by admin'
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public createAnswerComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { content, answerId } = req.body;
            const userId = req.user.id;

            const comment = await this.qaService.createAnswerComment(userId, answerId, content);

            res.status(201).json({
                success: true,
                message: 'Comment created successfully',
                data: comment
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public deleteAnswerComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await this.qaService.deleteAnswerComment(id, userId);

            res.status(200).json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            next(errorHandler(error.message.includes('Unauthorized') ? 403 : 400, error.message));
        }
    };

    public adminDeleteAnswerComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const { id } = req.params;
            await this.qaService.adminDeleteAnswerComment(id);

            res.status(200).json({
                success: true,
                message: 'Comment deleted successfully by admin'
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    // ------------------- Vote Operations -------------------

    public voteQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { questionId, type } = req.body;
            const userId = req.user.id;

            const result = await this.qaService.voteQuestion(userId, questionId, type);

            res.status(200).json({
                success: true,
                message: `Vote ${result.action} successfully`,
                data: result
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public voteAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { answerId, type } = req.body;
            const userId = req.user.id;

            const result = await this.qaService.voteAnswer(userId, answerId, type);

            res.status(200).json({
                success: true,
                message: `Vote ${result.action} successfully`,
                data: result
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    // ------------------- Tag Operations -------------------

    public createTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Only admins can create tags
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const { name } = req.body;
            const tag = await this.qaService.createTag(name);

            res.status(201).json({
                success: true,
                message: 'Tag created successfully',
                data: tag
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getTags = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tags = await this.qaService.getTags();

            res.status(200).json({
                success: true,
                message: 'Tags retrieved successfully',
                data: tags
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };

    public getTagById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const tag = await this.qaService.getTagById(id);

            res.status(200).json({
                success: true,
                message: 'Tag retrieved successfully',
                data: tag
            });
        } catch (error) {
            next(errorHandler(404, error.message));
        }
    };

    // ------------------- Statistics Operations -------------------

    public getQAStatistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Only admins can view statistics
            if (req.user.role !== Role.ADMIN) {
                return next(errorHandler(403, 'Unauthorized: Admin access required'));
            }

            const statistics = await this.qaService.getQAStatistics();

            res.status(200).json({
                success: true,
                message: 'QA statistics retrieved successfully',
                data: statistics
            });
        } catch (error) {
            next(errorHandler(400, error.message));
        }
    };
}

export const qaController = new QAController();