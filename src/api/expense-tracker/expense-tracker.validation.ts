import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../utils/errorHandler';
import { PaymentMethod, Term, UniversityPaymentType } from '@prisma/client';

// Import the ExpenseCategoryType enum
import { ExpenseCategoryType } from '@prisma/client';

// Expense validation schema
const expenseSchema = z.object({
    amount: z.number()
        .positive("Amount must be positive")
        .finite("Amount must be a valid number"),
    description: z.string().trim().nullable().optional(),
    date: z.coerce.date(),
    category: z.nativeEnum(ExpenseCategoryType),
    paymentMethod: z.nativeEnum(PaymentMethod).nullable().optional(),
    location: z.string().trim().nullable().optional(),
    semesterId: z.string().trim().nullable().optional(),
});

// Income validation schema
const incomeSchema = z.object({
    amount: z.number()
        .positive("Amount must be positive")
        .finite("Amount must be a valid number"),
    source: z.string().trim().min(1, "Source is required"),
    description: z.string().trim().nullable().optional(),
    date: z.coerce.date(),
    recurring: z.boolean().optional(),
});

// Semester validation schema
const semesterSchema = z.object({
    name: z.string().trim().min(1, "Semester name is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    year: z.number().int().positive("Year must be a positive integer"),
    term: z.nativeEnum(Term),
    isActive: z.boolean().optional(),
});

// Payment Schedule validation schema
const paymentScheduleSchema = z.object({
    name: z.string().trim().min(1, "Payment name is required"),
    amount: z.number()
        .positive("Amount must be positive")
        .finite("Amount must be a valid number"),
    dueDate: z.coerce.date(),
    isPaid: z.boolean().optional(),
    paidDate: z.coerce.date().nullable().optional(),
    semesterId: z.string().trim().min(1, "Semester ID is required"),
    paymentType: z.nativeEnum(UniversityPaymentType),
    notes: z.string().trim().nullable().optional(),
});

// Filter options validation schemas
const dateFilterSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

const paginationSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Expense filter schema
const expenseFilterSchema = dateFilterSchema.extend({
    categories: z.array(z.nativeEnum(ExpenseCategoryType)).optional(),
    semesterId: z.string().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    paymentMethods: z.array(z.nativeEnum(PaymentMethod)).optional(),
}).merge(paginationSchema);

// Income filter schema
const incomeFilterSchema = dateFilterSchema.extend({
    recurring: z.boolean().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
}).merge(paginationSchema);

// Expense-Income comparison schema
const expenseIncomeComparisonSchema = dateFilterSchema.extend({
    groupBy: z.enum(['day', 'week', 'month', 'year']),
    semesterId: z.string().optional(),
});

// Dashboard stats filter schema
const dashboardStatsSchema = z.object({
    period: z.enum(['this-month', 'last-month', 'this-year', 'last-year', 'all-time', 'custom']),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    semesterId: z.string().optional(),
}).refine(data => {
    if (data.period === 'custom' && (!data.startDate || !data.endDate)) {
        return false;
    }
    return true;
}, {
    message: "startDate and endDate are required when period is 'custom'",
    path: ['startDate', 'endDate']
});

// Validation middleware factory
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            const errorMessage = "Validation failed. Please check your input.";
            return next(errorHandler(400, errorMessage, { validationErrors }));
        }
        next(errorHandler(400, "Invalid request data"));
    }
};

// Query params validation middleware
const validateQuery = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        // Parse query parameters, converting strings to appropriate types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queryParams: Record<string, any> = { ...req.query };

        // Handle array parameters
        if (queryParams.categoryIds && typeof queryParams.categoryIds === 'string') {
            queryParams.categoryIds = queryParams.categoryIds.split(',');
        }

        if (queryParams.paymentMethods && typeof queryParams.paymentMethods === 'string') {
            queryParams.paymentMethods = queryParams.paymentMethods.split(',');
        }

        // Handle numeric parameters
        ['page', 'limit', 'minAmount', 'maxAmount', 'year'].forEach(param => {
            if (queryParams[param] && typeof queryParams[param] === 'string') {
                queryParams[param] = Number(queryParams[param]);
            }
        });

        // Handle boolean parameters
        ['recurring', 'includeCompleted', 'includeExpired', 'isActive'].forEach(param => {
            if (queryParams[param] && typeof queryParams[param] === 'string') {
                queryParams[param] = queryParams[param] === 'true';
            }
        });

        schema.parse(queryParams);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            const errorMessage = "Query validation failed. Please check your parameters.";
            return next(errorHandler(400, errorMessage, { validationErrors }));
        }
        next(errorHandler(400, "Invalid query parameters"));
    }
};

// Export validation middlewares
export const validateExpense = validate(expenseSchema);
export const validateIncome = validate(incomeSchema);
export const validateSemester = validate(semesterSchema);
export const validatePaymentSchedule = validate(paymentScheduleSchema);

export const validateExpenseFilters = validateQuery(expenseFilterSchema);
export const validateIncomeFilters = validateQuery(incomeFilterSchema);
export const validateExpenseIncomeComparison = validateQuery(expenseIncomeComparisonSchema);
export const validateDashboardStats = validateQuery(dashboardStatsSchema);
