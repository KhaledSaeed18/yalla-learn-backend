import { Router } from "express";
import AIController from "./ai.controller";
import { chatCompletionLimiter, chatHistoryLimiter, continueChatLimiter } from "./ai.rateLimiting";
import { validateChatCompletion, validateContinueConversation, validateConversationHistory } from "./ai.validation";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class AIRouter {
    private router: Router;
    private aiController: AIController;

    constructor() {
        this.router = Router();
        this.aiController = new AIController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Chat completion endpoint
        this.router.post(
            "/chat",
            authorize,
            chatCompletionLimiter,
            sanitizeRequestBody,
            validateChatCompletion,
            this.aiController.chatCompletion
        );

        // Get conversation history
        this.router.get(
            "/history",
            authorize,
            chatHistoryLimiter,
            validateConversationHistory,
            this.aiController.getConversationHistory
        );

        // Continue an existing conversation
        this.router.post(
            "/continue",
            authorize,
            continueChatLimiter,
            sanitizeRequestBody,
            validateContinueConversation,
            this.aiController.continueConversation
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}