import { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";
import { errorHandler } from "../../utils/errorHandler";

// Validate create interview request
export const validateCreateInterview = [
    body("topic").isString().trim().notEmpty().withMessage("Topic is required")
        .isLength({ min: 3, max: 100 }).withMessage("Topic must be between 3 and 100 characters"),
    body("level").isIn(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).withMessage("Valid level is required"),
    body("duration").optional().isInt({ min: 10, max: 120 }).withMessage("Duration must be between 10 and 120 minutes"),
    body("questionsCount").optional().isInt({ min: 3, max: 20 }).withMessage("Questions count must be between 3 and 20"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

// Validate continue interview request
export const validateContinueInterview = [
    body("interviewId").isUUID().withMessage("Valid interview ID is required"),
    body("response").isString().notEmpty().withMessage("Response content is required"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

// Validate complete interview request
export const validateCompleteInterview = [
    param("interviewId").isUUID().withMessage("Valid interview ID is required"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

// Validate get interview details request
export const validateGetInterviewDetails = [
    param("interviewId").isUUID().withMessage("Valid interview ID is required"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];

// Validate interview history request
export const validateInterviewHistory = [
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorHandler(400, errors.array()[0].msg));
        }
        next();
    }
];
