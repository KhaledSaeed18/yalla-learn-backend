/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { ExpenseTrackerService } from "./expense-tracker.service";
import { errorHandler } from "../../utils/errorHandler";
import { ExpenseCategoryType, PaymentMethod, Term } from "@prisma/client";

// Filter option interfaces
interface ExpenseFilterOptions {
    startDate?: Date;
    endDate?: Date;
    categories?: ExpenseCategoryType[];
    semesterId?: string;
    minAmount?: number;
    maxAmount?: number;
    paymentMethods?: PaymentMethod[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface IncomeFilterOptions {
    startDate?: Date;
    endDate?: Date;
    recurring?: boolean;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export default class ExpenseTrackerController {
    private expenseTrackerService: ExpenseTrackerService;

    constructor() {
        this.expenseTrackerService = new ExpenseTrackerService();
        this.bindMethods();
    }

    // Bind all methods to maintain 'this' context
    private bindMethods() {
        // Expense methods
        this.createExpense = this.createExpense.bind(this);
        this.getExpenses = this.getExpenses.bind(this);
        this.getExpenseById = this.getExpenseById.bind(this);
        this.updateExpense = this.updateExpense.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);

        // Income methods
        this.createIncome = this.createIncome.bind(this);
        this.getIncomes = this.getIncomes.bind(this);
        this.getIncomeById = this.getIncomeById.bind(this);
        this.updateIncome = this.updateIncome.bind(this);
        this.deleteIncome = this.deleteIncome.bind(this);

        // Semester methods
        this.createSemester = this.createSemester.bind(this);
        this.getSemesters = this.getSemesters.bind(this);
        this.getSemesterById = this.getSemesterById.bind(this);
        this.getActiveSemester = this.getActiveSemester.bind(this);
        this.updateSemester = this.updateSemester.bind(this);
        this.deleteSemester = this.deleteSemester.bind(this);

        // Payment Schedule methods
        this.createPaymentSchedule = this.createPaymentSchedule.bind(this);
        this.getPaymentSchedules = this.getPaymentSchedules.bind(this);
        this.getPaymentScheduleById = this.getPaymentScheduleById.bind(this);
        this.updatePaymentSchedule = this.updatePaymentSchedule.bind(this);
        this.deletePaymentSchedule = this.deletePaymentSchedule.bind(this);

        // Reports & Statistics methods
        this.getExpenseSummaryByCategory = this.getExpenseSummaryByCategory.bind(this);
        this.getExpenseIncomeComparison = this.getExpenseIncomeComparison.bind(this);
        this.getDashboardStats = this.getDashboardStats.bind(this);
    }

    // Helper method to extract user ID from request
    private getUserId(req: Request): string {
        return req.user?.userId as string;
    }

    // Helper method to format response
    private formatResponse(status: number, message: string, data: any) {
        return {
            status: status >= 200 && status < 300 ? "success" : "error",
            statusCode: status,
            message,
            data
        };
    }

    // ************************ EXPENSE CONTROLLERS ************************ //

    async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const expense = await this.expenseTrackerService.createExpense(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Expense created successfully",
                { expense }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes("Invalid")) {
                next(errorHandler(400, message));
                return;
            }
            next(errorHandler(500, message || "Failed to create expense"));
        }
    }

    async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Create empty options object with the right type
            const options: ExpenseFilterOptions = {};

            // Convert and copy query parameters
            if (req.query.startDate) {
                options.startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                options.endDate = new Date(req.query.endDate as string);
            }

            if (req.query.categories) {
                options.categories = typeof req.query.categories === 'string'
                    ? req.query.categories.split(',') as ExpenseCategoryType[]
                    : req.query.categories as ExpenseCategoryType[];
            }

            if (req.query.semesterId) {
                options.semesterId = req.query.semesterId as string;
            }

            if (req.query.minAmount) {
                options.minAmount = Number(req.query.minAmount);
            }

            if (req.query.maxAmount) {
                options.maxAmount = Number(req.query.maxAmount);
            }

            if (req.query.paymentMethods) {
                options.paymentMethods = typeof req.query.paymentMethods === 'string'
                    ? req.query.paymentMethods.split(',') as PaymentMethod[]
                    : req.query.paymentMethods as PaymentMethod[];
            }

            if (req.query.page) {
                options.page = Number(req.query.page);
            }

            if (req.query.limit) {
                options.limit = Number(req.query.limit);
            }

            if (req.query.sortBy) {
                options.sortBy = req.query.sortBy as string;
            }

            if (req.query.sortOrder) {
                options.sortOrder = req.query.sortOrder as 'asc' | 'desc';
            }

            const result = await this.expenseTrackerService.getExpenses(userId, options);

            res.status(200).json(this.formatResponse(
                200,
                "Expenses retrieved successfully",
                result
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve expenses"));
        }
    }

    async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const expenseId = req.params.id;
            const expense = await this.expenseTrackerService.getExpenseById(expenseId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Expense retrieved successfully",
                { expense }
            ));
        } catch (err) {
            if ((err as Error).message === "Expense not found") {
                next(errorHandler(404, "Expense not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve expense"));
        }
    }

    async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const expenseId = req.params.id;
            const updatedExpense = await this.expenseTrackerService.updateExpense(
                expenseId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Expense updated successfully",
                { expense: updatedExpense }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Expense not found") {
                next(errorHandler(404, "Expense not found"));
                return;
            }
            if (message.includes("Invalid")) {
                next(errorHandler(400, message));
                return;
            }
            next(errorHandler(500, message || "Failed to update expense"));
        }
    }

    async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const expenseId = req.params.id;
            await this.expenseTrackerService.deleteExpense(expenseId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Expense deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Expense not found") {
                next(errorHandler(404, "Expense not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete expense"));
        }
    }

    // ************************ INCOME CONTROLLERS ************************ //

    async createIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const income = await this.expenseTrackerService.createIncome(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Income created successfully",
                { income }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create income"));
        }
    }

    async getIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Create empty options object with the right type
            const options: IncomeFilterOptions = {};

            // Convert and copy query parameters
            if (req.query.startDate) {
                options.startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                options.endDate = new Date(req.query.endDate as string);
            }

            if (req.query.recurring !== undefined) {
                options.recurring = req.query.recurring === 'true';
            }

            if (req.query.minAmount) {
                options.minAmount = Number(req.query.minAmount);
            }

            if (req.query.maxAmount) {
                options.maxAmount = Number(req.query.maxAmount);
            }

            if (req.query.page) {
                options.page = Number(req.query.page);
            }

            if (req.query.limit) {
                options.limit = Number(req.query.limit);
            }

            if (req.query.sortBy) {
                options.sortBy = req.query.sortBy as string;
            }

            if (req.query.sortOrder) {
                options.sortOrder = req.query.sortOrder as 'asc' | 'desc';
            }

            const result = await this.expenseTrackerService.getIncomes(userId, options);

            res.status(200).json(this.formatResponse(
                200,
                "Incomes retrieved successfully",
                result
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve incomes"));
        }
    }

    async getIncomeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const incomeId = req.params.id;
            const income = await this.expenseTrackerService.getIncomeById(incomeId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Income retrieved successfully",
                { income }
            ));
        } catch (err) {
            if ((err as Error).message === "Income record not found") {
                next(errorHandler(404, "Income not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve income"));
        }
    }

    async updateIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const incomeId = req.params.id;
            const updatedIncome = await this.expenseTrackerService.updateIncome(
                incomeId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Income updated successfully",
                { income: updatedIncome }
            ));
        } catch (err) {
            if ((err as Error).message === "Income record not found") {
                next(errorHandler(404, "Income not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update income"));
        }
    }

    async deleteIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const incomeId = req.params.id;
            await this.expenseTrackerService.deleteIncome(incomeId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Income deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Income record not found") {
                next(errorHandler(404, "Income not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete income"));
        }
    }

    // ************************ SEMESTER CONTROLLERS ************************ //

    async createSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const semester = await this.expenseTrackerService.createSemester(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Semester created successfully",
                { semester }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create semester"));
        }
    }

    async getSemesters(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Convert query parameters to appropriate types
            const options: {
                includeCompleted?: boolean;
                term?: Term;
                year?: number;
            } = {};

            // Copy and convert query parameters
            if (req.query.includeCompleted !== undefined) {
                options.includeCompleted = req.query.includeCompleted === 'true';
            }

            if (req.query.term) {
                options.term = req.query.term as Term;
            }

            if (req.query.year) {
                options.year = Number(req.query.year);
            }

            const semesters = await this.expenseTrackerService.getSemesters(userId, options);

            res.status(200).json(this.formatResponse(
                200,
                "Semesters retrieved successfully",
                { semesters }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve semesters"));
        }
    }

    async getSemesterById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const semesterId = req.params.id;
            const semester = await this.expenseTrackerService.getSemesterById(semesterId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Semester retrieved successfully",
                { semester }
            ));
        } catch (err) {
            if ((err as Error).message === "Semester not found") {
                next(errorHandler(404, "Semester not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve semester"));
        }
    }

    async getActiveSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const semester = await this.expenseTrackerService.getActiveSemester(userId);

            if (!semester) {
                res.status(404).json(this.formatResponse(
                    404,
                    "No active semester found",
                    null
                ));
                return;
            }

            res.status(200).json(this.formatResponse(
                200,
                "Active semester retrieved successfully",
                { semester }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve active semester"));
        }
    }

    async updateSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const semesterId = req.params.id;
            const updatedSemester = await this.expenseTrackerService.updateSemester(
                semesterId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Semester updated successfully",
                { semester: updatedSemester }
            ));
        } catch (err) {
            if ((err as Error).message === "Semester not found") {
                next(errorHandler(404, "Semester not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update semester"));
        }
    }

    async deleteSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const semesterId = req.params.id;
            await this.expenseTrackerService.deleteSemester(semesterId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Semester deleted successfully",
                null
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Semester not found") {
                next(errorHandler(404, "Semester not found"));
                return;
            }
            if (message.includes("associated")) {
                next(errorHandler(400, "Cannot delete semester with associated records"));
                return;
            }
            next(errorHandler(500, message || "Failed to delete semester"));
        }
    }

    // ************************ PAYMENT SCHEDULE CONTROLLERS ************************ //

    async createPaymentSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const paymentSchedule = await this.expenseTrackerService.createPaymentSchedule(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Payment schedule created successfully",
                { paymentSchedule }
            ));
        } catch (err) {
            if ((err as Error).message === "Invalid semester") {
                next(errorHandler(400, "Invalid semester"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create payment schedule"));
        }
    }

    async getPaymentSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const paymentSchedules = await this.expenseTrackerService.getPaymentSchedules(userId, req.query as any);

            res.status(200).json(this.formatResponse(
                200,
                "Payment schedules retrieved successfully",
                { paymentSchedules }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve payment schedules"));
        }
    }

    async getPaymentScheduleById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const scheduleId = req.params.id;
            const paymentSchedule = await this.expenseTrackerService.getPaymentScheduleById(scheduleId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Payment schedule retrieved successfully",
                { paymentSchedule }
            ));
        } catch (err) {
            if ((err as Error).message === "Payment schedule not found") {
                next(errorHandler(404, "Payment schedule not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve payment schedule"));
        }
    }

    async updatePaymentSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const scheduleId = req.params.id;
            const updatedSchedule = await this.expenseTrackerService.updatePaymentSchedule(
                scheduleId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Payment schedule updated successfully",
                { paymentSchedule: updatedSchedule }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Payment schedule not found") {
                next(errorHandler(404, "Payment schedule not found"));
                return;
            }
            if (message === "Invalid semester") {
                next(errorHandler(400, "Invalid semester"));
                return;
            }
            next(errorHandler(500, message || "Failed to update payment schedule"));
        }
    }

    async deletePaymentSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const scheduleId = req.params.id;
            await this.expenseTrackerService.deletePaymentSchedule(scheduleId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Payment schedule deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Payment schedule not found") {
                next(errorHandler(404, "Payment schedule not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete payment schedule"));
        }
    }

    // ************************ REPORTS & STATISTICS CONTROLLERS ************************ //

    async getExpenseSummaryByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const summary = await this.expenseTrackerService.getExpenseSummaryByCategory(userId, req.query as any);

            res.status(200).json(this.formatResponse(
                200,
                "Expense summary retrieved successfully",
                summary
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to generate expense summary"));
        }
    }

    async getExpenseIncomeComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Parse query parameters
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            const groupBy = (req.query.groupBy as 'day' | 'week' | 'month' | 'year') || 'month';
            const semesterId = req.query.semesterId as string | undefined;

            const comparison = await this.expenseTrackerService.getExpenseIncomeComparison(userId, {
                startDate,
                endDate,
                groupBy,
                semesterId
            });

            res.status(200).json(this.formatResponse(
                200,
                "Expense-income comparison retrieved successfully",
                comparison
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to generate expense-income comparison"));
        }
    }

    async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Parse query parameters
            const period = (req.query.period as 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'all-time' | 'custom') || 'this-month';
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            const semesterId = req.query.semesterId as string | undefined;

            // Validate custom period parameters
            if (period === 'custom' && (!startDate || !endDate)) {
                next(errorHandler(400, "startDate and endDate are required for custom period"));
                return;
            }

            const stats = await this.expenseTrackerService.getDashboardStats(userId, {
                period,
                startDate,
                endDate,
                semesterId
            });

            res.status(200).json(this.formatResponse(
                200,
                "Dashboard statistics retrieved successfully",
                stats
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to generate dashboard statistics"));
        }
    }
}
