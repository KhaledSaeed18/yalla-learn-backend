import { Router } from 'express';
import { ChatControllerSimple } from './chat.controller';
import { authorize } from '../../middlewares/authorization.middleware';
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';
import { chatLimiter } from './chat.rateLimiting';

export default class ChatRouter {
    private router: Router;
    private chatController: ChatControllerSimple;

    constructor() {
        this.router = Router();
        this.chatController = new ChatControllerSimple();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Get user's conversations
        this.router.get(
            '/conversations',
            authorize,
            chatLimiter,
            this.chatController.getUserConversations.bind(this.chatController)
        );

        // Get conversation messages
        this.router.get(
            '/conversations/:conversationId/messages',
            authorize,
            chatLimiter,
            this.chatController.getConversationMessages.bind(this.chatController)
        );

        // Create a new conversation
        this.router.post(
            '/conversations',
            authorize,
            chatLimiter,
            sanitizeRequestBody,
            this.chatController.createConversation.bind(this.chatController)
        );

        // Send a message to an existing conversation
        this.router.post(
            '/conversations/:conversationId/messages',
            authorize,
            chatLimiter,
            sanitizeRequestBody,
            this.chatController.sendMessage.bind(this.chatController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
