import { Router } from "express";
import QAController from "./qa.controller";
import { acceptAnswerLimiter, answerCreateLimiter, answerDeleteLimiter, answerGetLimiter, answerUpdateLimiter, questionCreateLimiter, questionDeleteLimiter, questionGetLimiter, questionUpdateLimiter, tagCreateLimiter, tagDeleteLimiter, voteLimiter } from "./qa.rateLimiting";
import { validateAcceptAnswer, validateAnswerCreate, validateAnswerVote, validateGetAnswersQuery, validateGetQuestionsQuery, validateQuestionCreate, validateTagCreate, validateUpdateAnswer, validateUpdateQuestion } from "./qa.validation";
import { authorize, authorizeAdmin } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class QARouter {
    private router: Router;
    private qaController: QAController;

    constructor() {
        this.router = Router();
        this.qaController = new QAController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // **** Tag routes ****
        // Create tag (admin only)
        this.router.post(
            "/tags",
            authorize,
            authorizeAdmin,
            tagCreateLimiter,
            sanitizeRequestBody,
            validateTagCreate,
            this.qaController.createTag
        );

        // Get all tags
        this.router.get(
            "/tags",
            this.qaController.getTags
        );

        // Delete tag (admin only)
        this.router.delete(
            "/tags/:id",
            authorize,
            authorizeAdmin,
            tagDeleteLimiter,
            this.qaController.deleteTag
        );

        // **** Question routes ****
        // Get all questions with filters
        this.router.get(
            "/questions",
            questionGetLimiter,
            validateGetQuestionsQuery,
            this.qaController.getQuestions
        );

        // Get question by ID or slug
        this.router.get(
            "/questions/:idOrSlug",
            questionGetLimiter,
            this.qaController.getQuestionByIdOrSlug
        );

        // Create question
        this.router.post(
            "/questions",
            authorize,
            questionCreateLimiter,
            sanitizeRequestBody,
            validateQuestionCreate,
            this.qaController.createQuestion
        );

        // Get user's own questions
        this.router.get(
            "/user/questions",
            authorize,
            questionGetLimiter,
            validateGetQuestionsQuery,
            this.qaController.getUserQuestions
        );

        // Update question
        this.router.put(
            "/questions/:id",
            authorize,
            questionUpdateLimiter,
            sanitizeRequestBody,
            validateUpdateQuestion,
            this.qaController.updateQuestion
        );

        // Delete question
        this.router.delete(
            "/questions/:id",
            authorize,
            questionDeleteLimiter,
            this.qaController.deleteQuestion
        );

        // Admin route for deleting any question
        this.router.delete(
            "/admin/questions/:id",
            authorize,
            authorizeAdmin,
            questionDeleteLimiter,
            this.qaController.adminDeleteQuestion
        );

        // **** Answer routes ****
        // Create a new answer
        this.router.post(
            "/answers",
            authorize,
            answerCreateLimiter,
            sanitizeRequestBody,
            validateAnswerCreate,
            this.qaController.createAnswer
        );

        // Get answers with pagination and filters
        this.router.get(
            "/answers",
            answerGetLimiter,
            validateGetAnswersQuery,
            this.qaController.getAnswers
        );

        // Get answer by ID
        this.router.get(
            "/answers/:id",
            answerGetLimiter,
            this.qaController.getAnswerById
        );

        // Update answer
        this.router.put(
            "/answers/:id",
            authorize,
            answerUpdateLimiter,
            sanitizeRequestBody,
            validateUpdateAnswer,
            this.qaController.updateAnswer
        );

        // Delete answer
        this.router.delete(
            "/answers/:id",
            authorize,
            answerDeleteLimiter,
            this.qaController.deleteAnswer
        );

        // Admin route for deleting any answer
        this.router.delete(
            "/admin/answers/:id",
            authorize,
            authorizeAdmin,
            answerDeleteLimiter,
            this.qaController.adminDeleteAnswer
        );

        // Vote on answer
        this.router.post(
            "/answers/vote",
            authorize,
            voteLimiter,
            sanitizeRequestBody,
            validateAnswerVote,
            this.qaController.voteAnswer
        );

        // Accept an answer
        this.router.post(
            "/answers/accept",
            authorize,
            acceptAnswerLimiter,
            sanitizeRequestBody,
            validateAcceptAnswer,
            this.qaController.acceptAnswer
        );

        // Unaccept an answer
        this.router.post(
            "/answers/unaccept",
            authorize,
            acceptAnswerLimiter,
            sanitizeRequestBody,
            validateAcceptAnswer,
            this.qaController.unacceptAnswer
        );

        // Get user votes
        this.router.get(
            "/user/votes",
            authorize,
            this.qaController.getUserVotes
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}