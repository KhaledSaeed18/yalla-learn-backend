import { Router } from "express";
import { InterviewController } from "./interviews.controller";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from "../../middlewares/sanitizeBody.middleware";
import {
    createInterviewLimiter,
    continueInterviewLimiter,
    completeInterviewLimiter,
    interviewHistoryLimiter
} from "./interviews.rateLimiting";
import {
    validateCreateInterview,
    validateContinueInterview,
    validateCompleteInterview,
    validateGetInterviewDetails,
    validateInterviewHistory
} from "./interviews.validation";

export default class InterviewRouter {
    private router: Router;
    private interviewController: InterviewController;

    constructor() {
        this.router = Router();
        this.interviewController = new InterviewController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Create a new interview
        this.router.post(
            "/create",
            authorize,
            createInterviewLimiter,
            sanitizeRequestBody,
            validateCreateInterview,
            this.interviewController.createInterview.bind(this.interviewController)
        );

        // Continue an interview
        this.router.post(
            "/continue",
            authorize,
            continueInterviewLimiter,
            sanitizeRequestBody,
            validateContinueInterview,
            this.interviewController.continueInterview.bind(this.interviewController)
        );

        // Continue an interview with streaming response
        this.router.post(
            "/continue/stream",
            authorize,
            continueInterviewLimiter,
            sanitizeRequestBody,
            validateContinueInterview,
            this.interviewController.streamContinueInterview.bind(this.interviewController)
        );

        // Complete an interview
        this.router.post(
            "/:interviewId/complete",
            authorize,
            completeInterviewLimiter,
            validateCompleteInterview,
            this.interviewController.completeInterview.bind(this.interviewController)
        );

        // Get interview history
        this.router.get(
            "/history",
            authorize,
            interviewHistoryLimiter,
            validateInterviewHistory,
            this.interviewController.getInterviewHistory.bind(this.interviewController)
        );

        // Get interview details
        this.router.get(
            "/:interviewId",
            authorize,
            validateGetInterviewDetails,
            this.interviewController.getInterviewDetails.bind(this.interviewController)
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
