import { Request, Response, NextFunction } from "express";
import { InterviewService } from "./interviews.service";
import { errorHandler } from "../../utils/errorHandler";

export class InterviewController {
    private interviewService: InterviewService;

    constructor() {
        this.interviewService = new InterviewService();
    }

    /**
     * Create a new interview session
     */
    async createInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { topic, level, duration, questionsCount } = req.body;
            const userId = req.user.userId;

            const interview = await this.interviewService.createInterview(userId, {
                topic,
                level,
                duration,
                questionsCount
            });

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Interview created successfully",
                data: interview
            });
        } catch (err) {
            console.error('Error in create interview controller:', err);
            if ((err as Error).message.includes('API key')) {
                next(errorHandler(500, "AI service configuration error"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create interview"));
        }
    }

    /**
     * Continue an interview with a user response
     */
    async continueInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { interviewId, response } = req.body;
            const userId = req.user.userId;

            const result = await this.interviewService.continueInterview(
                interviewId,
                userId,
                response
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Interview continued successfully",
                data: result
            });
        } catch (err) {
            console.error('Error in continue interview controller:', err);
            if ((err as Error).message.includes('Interview not found')) {
                next(errorHandler(404, "Interview not found or does not belong to you"));
                return;
            }
            if ((err as Error).message.includes('already been completed')) {
                next(errorHandler(400, "This interview has already been completed"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to continue interview"));
        }
    }

    /**
     * Continue an interview with streaming response
     */
    async streamContinueInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { interviewId, response, maxTokens, temperature } = req.body;
            const userId = req.user.userId;

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Get streaming response
            const { stream, interviewId: confirmedId, savePromise } =
                await this.interviewService.continueInterviewStream(
                    interviewId,
                    userId,
                    response,
                    { maxTokens, temperature }
                );

            // Stream chunks to the client
            for await (const chunk of stream) {
                const text = chunk.text();
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                // Use flush only if it exists and is a function
                if (res.flush && typeof res.flush === 'function') {
                    res.flush();
                }
            }

            // Wait for messages to be saved and send completion event
            const fullResponse = await savePromise;
            res.write(`data: ${JSON.stringify({
                done: true,
                interviewId: confirmedId,
                usage: {
                    promptTokens: this.interviewService.estimateTokenCount(response),
                    completionTokens: this.interviewService.estimateTokenCount(fullResponse)
                }
            })}\n\n`);

            res.end();
        } catch (err) {
            console.error('Error in streaming interview continuation:', err);

            // If headers haven't been sent yet, send a regular error response
            if (!res.headersSent) {
                if ((err as Error).message.includes('Interview not found')) {
                    next(errorHandler(404, "Interview not found or does not belong to you"));
                    return;
                }
                if ((err as Error).message.includes('already been completed')) {
                    next(errorHandler(400, "This interview has already been completed"));
                    return;
                }
                next(errorHandler(500, (err as Error).message || "Failed to continue interview"));
                return;
            }

            // If we're already streaming, send error as an event
            res.write(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
            res.end();
        }
    }

    /**
     * Complete an interview and generate feedback
     */
    async completeInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { interviewId } = req.params;
            const userId = req.user.userId;

            const result = await this.interviewService.completeInterview(interviewId, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Interview completed successfully",
                data: result
            });
        } catch (err) {
            console.error('Error in complete interview controller:', err);
            if ((err as Error).message.includes('not found')) {
                next(errorHandler(404, "Active interview not found or does not belong to you"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to complete interview"));
        }
    }

    /**
     * Get interview history
     */
    async getInterviewHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const userId = req.user.userId;
            const { limit = 10, page = 1 } = req.query as { limit?: string, page?: string };

            const history = await this.interviewService.getInterviewHistory(
                userId,
                parseInt(limit.toString()),
                parseInt(page.toString())
            );

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Interview history retrieved successfully",
                data: history
            });
        } catch (err) {
            console.error('Error in get interview history controller:', err);
            next(errorHandler(500, (err as Error).message || "Failed to retrieve interview history"));
        }
    }

    /**
     * Get interview details
     */
    async getInterviewDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                next(errorHandler(401, "Authentication required"));
                return;
            }

            const { interviewId } = req.params;
            const userId = req.user.userId;

            const interview = await this.interviewService.getInterviewDetails(interviewId, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Interview details retrieved successfully",
                data: interview
            });
        } catch (err) {
            console.error('Error in get interview details controller:', err);
            if ((err as Error).message.includes('not found')) {
                next(errorHandler(404, "Interview not found or does not belong to you"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve interview details"));
        }
    }
}
