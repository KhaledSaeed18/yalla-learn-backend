import { Request, Response, NextFunction } from "express";
import { AIService } from "./ai.service";
import { errorHandler } from "../../utils/errorHandler";

export default class AIController {
    private aiService: AIService;

    constructor() {
        this.aiService = new AIService();
        this.chatCompletion = this.chatCompletion.bind(this);
        this.getConversationHistory = this.getConversationHistory.bind(this);
        this.continueConversation = this.continueConversation.bind(this);
    }

    /**
 * Generate AI chat completion
 */
    async chatCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { messages, maxTokens, temperature } = req.body;

            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId;

            if (!Array.isArray(messages) || messages.length === 0) {
                next(errorHandler(400, "Messages array is required and cannot be empty"));
                return;
            }

            for (const message of messages) {
                if (!message.role || !message.content ||
                    !['user', 'assistant'].includes(message.role)) {
                    next(errorHandler(400, "Each message must have a role ('user' or 'assistant') and content"));
                    return;
                }
            }

            const response = await this.aiService.createChatCompletion(
                messages,
                userId,
                { maxTokens, temperature }
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Chat completion generated successfully",
                data: response
            });
        } catch (err) {
            console.error('Error in chat completion controller:', err);
            if ((err as Error).message.includes('API key')) {
                next(errorHandler(500, "AI service configuration error"));
                return;
            }
            if ((err as Error).message.includes('userId is required')) {
                next(errorHandler(400, "User ID is required for this operation"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to generate AI response"));
        }
    }

    /**
     * Get user's conversation history
     */
    async getConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId;
            const { limit = 10, page = 1 } = req.query as { limit?: string, page?: string };

            const history = await this.aiService.getConversationHistory(
                userId,
                parseInt(limit.toString()),
                parseInt(page.toString())
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversation history retrieved successfully",
                data: history
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve conversation history"));
        }
    }

    /**
 * Continue an existing conversation with a new message
 */
    async continueConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { conversationId, message, maxTokens, temperature } = req.body;

            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            if (!conversationId || !message) {
                next(errorHandler(400, "Conversation ID and message are required"));
                return;
            }

            const userId = req.user.userId;

            const response = await this.aiService.continueConversation(
                conversationId,
                message,
                userId,
                { maxTokens, temperature }
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Conversation continued successfully",
                data: response
            });
        } catch (err) {
            console.error('Error in continue conversation controller:', err);

            if ((err as Error).message.includes('Conversation not found')) {
                next(errorHandler(404, "Conversation not found or does not belong to you"));
                return;
            }

            if ((err as Error).message.includes('API key')) {
                next(errorHandler(500, "AI service configuration error"));
                return;
            }

            next(errorHandler(500, (err as Error).message || "Failed to continue conversation"));
        }
    }
}