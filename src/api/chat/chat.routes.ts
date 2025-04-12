import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authorize } from '../../middlewares/authorization.middleware';
import { chatHistoryLimiter, messagesLimiter, createConversationLimiter } from './chat.rateLimiting';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class ChatRouter {
    private router: Router;
    private chatController: ChatController;

    constructor() {
        this.router = Router();
        this.chatController = new ChatController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Get user's conversations
        this.router.get(
            '/conversations',
            authorize,
            chatHistoryLimiter,
            this.chatController.getUserConversations.bind(this.chatController)
        );

        // Get conversation messages
        this.router.get(
            '/conversations/:conversationId/messages',
            authorize,
            messagesLimiter,
            this.chatController.getConversationMessages.bind(this.chatController)
        );

        // Create or get conversation with listing owner
        this.router.post(
            '/conversations',
            authorize,
            createConversationLimiter,
            sanitizeRequestBody,
            this.chatController.createOrGetConversation.bind(this.chatController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}