/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { ExpenseTrackerService } from "./expense-tracker.service";
import { errorHandler } from "../../utils/errorHandler";

export default class ExpenseTrackerController {
    private expenseTrackerService: ExpenseTrackerService;

    constructor() {
        this.expenseTrackerService = new ExpenseTrackerService();
        this.bindMethods();
    }

    // Bind all methods to maintain 'this' context
    private bindMethods() {
        // Expense Category methods
        this.createExpenseCategory = this.createExpenseCategory.bind(this);
        this.getExpenseCategories = this.getExpenseCategories.bind(this);
        this.getExpenseCategoryById = this.getExpenseCategoryById.bind(this);
        this.updateExpenseCategory = this.updateExpenseCategory.bind(this);
        this.deleteExpenseCategory = this.deleteExpenseCategory.bind(this);

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

        // Budget methods
        this.createBudget = this.createBudget.bind(this);
        this.getBudgets = this.getBudgets.bind(this);
        this.getBudgetById = this.getBudgetById.bind(this);
        this.updateBudget = this.updateBudget.bind(this);
        this.deleteBudget = this.deleteBudget.bind(this);

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

        // Savings Goal methods
        this.createSavingsGoal = this.createSavingsGoal.bind(this);
        this.getSavingsGoals = this.getSavingsGoals.bind(this);
        this.getSavingsGoalById = this.getSavingsGoalById.bind(this);
        this.updateSavingsGoal = this.updateSavingsGoal.bind(this);
        this.deleteSavingsGoal = this.deleteSavingsGoal.bind(this);

        // Reports & Statistics methods
        this.getExpenseSummaryByCategory = this.getExpenseSummaryByCategory.bind(this);
        this.getExpenseIncomeComparison = this.getExpenseIncomeComparison.bind(this);
        this.getBudgetVsActual = this.getBudgetVsActual.bind(this);
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

    // ************************ EXPENSE CATEGORY CONTROLLERS ************************ //

    async createExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const category = await this.expenseTrackerService.createExpenseCategory(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Expense category created successfully",
                { category }
            ));
        } catch (err) {
            if ((err as Error).message.includes("already exists")) {
                next(errorHandler(409, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create expense category"));
        }
    }

    async getExpenseCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const categories = await this.expenseTrackerService.getExpenseCategories(userId);

            res.status(200).json(this.formatResponse(
                200,
                "Expense categories retrieved successfully",
                { categories }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve expense categories"));
        }
    }

    async getExpenseCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const categoryId = req.params.id;
            const category = await this.expenseTrackerService.getExpenseCategoryById(categoryId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Expense category retrieved successfully",
                { category }
            ));
        } catch (err) {
            if ((err as Error).message === "Expense category not found") {
                next(errorHandler(404, "Expense category not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve expense category"));
        }
    }

    async updateExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const categoryId = req.params.id;
            const updatedCategory = await this.expenseTrackerService.updateExpenseCategory(
                categoryId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Expense category updated successfully",
                { category: updatedCategory }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Expense category not found") {
                next(errorHandler(404, "Expense category not found"));
                return;
            }
            if (message.includes("already exists")) {
                next(errorHandler(409, message));
                return;
            }
            next(errorHandler(500, message || "Failed to update expense category"));
        }
    }

    async deleteExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const categoryId = req.params.id;
            await this.expenseTrackerService.deleteExpenseCategory(categoryId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Expense category deleted successfully",
                null
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Expense category not found") {
                next(errorHandler(404, "Expense category not found"));
                return;
            }
            if (message.includes("associated with")) {
                next(errorHandler(400, message));
                return;
            }
            next(errorHandler(500, message || "Failed to delete expense category"));
        }
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
            const result = await this.expenseTrackerService.getExpenses(userId, req.query as any);

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
            const result = await this.expenseTrackerService.getIncomes(userId, req.query as any);

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

    // ************************ BUDGET CONTROLLERS ************************ //

    async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const budget = await this.expenseTrackerService.createBudget(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Budget created successfully",
                { budget }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes("Invalid")) {
                next(errorHandler(400, message));
                return;
            }
            next(errorHandler(500, message || "Failed to create budget"));
        }
    }

    async getBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const budgets = await this.expenseTrackerService.getBudgets(userId, req.query as any);

            res.status(200).json(this.formatResponse(
                200,
                "Budgets retrieved successfully",
                { budgets }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve budgets"));
        }
    }

    async getBudgetById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const budgetId = req.params.id;
            const budget = await this.expenseTrackerService.getBudgetById(budgetId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Budget retrieved successfully",
                { budget }
            ));
        } catch (err) {
            if ((err as Error).message === "Budget not found") {
                next(errorHandler(404, "Budget not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve budget"));
        }
    }

    async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const budgetId = req.params.id;
            const updatedBudget = await this.expenseTrackerService.updateBudget(
                budgetId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Budget updated successfully",
                { budget: updatedBudget }
            ));
        } catch (err) {
            const message = (err as Error).message;
            if (message === "Budget not found") {
                next(errorHandler(404, "Budget not found"));
                return;
            }
            if (message.includes("Invalid")) {
                next(errorHandler(400, message));
                return;
            }
            next(errorHandler(500, message || "Failed to update budget"));
        }
    }

    async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const budgetId = req.params.id;
            await this.expenseTrackerService.deleteBudget(budgetId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Budget deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Budget not found") {
                next(errorHandler(404, "Budget not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete budget"));
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
            const semesters = await this.expenseTrackerService.getSemesters(userId, req.query as any);

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

    // ************************ SAVINGS GOAL CONTROLLERS ************************ //

    async createSavingsGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const savingsGoal = await this.expenseTrackerService.createSavingsGoal(userId, req.body);

            res.status(201).json(this.formatResponse(
                201,
                "Savings goal created successfully",
                { savingsGoal }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create savings goal"));
        }
    }

    async getSavingsGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const includeCompleted = req.query.includeCompleted === 'true';

            const savingsGoals = await this.expenseTrackerService.getSavingsGoals(userId, {
                includeCompleted
            });

            res.status(200).json(this.formatResponse(
                200,
                "Savings goals retrieved successfully",
                { savingsGoals }
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve savings goals"));
        }
    }

    async getSavingsGoalById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const goalId = req.params.id;
            const savingsGoal = await this.expenseTrackerService.getSavingsGoalById(goalId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Savings goal retrieved successfully",
                { savingsGoal }
            ));
        } catch (err) {
            if ((err as Error).message === "Savings goal not found") {
                next(errorHandler(404, "Savings goal not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve savings goal"));
        }
    }

    async updateSavingsGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const goalId = req.params.id;
            const updatedGoal = await this.expenseTrackerService.updateSavingsGoal(
                goalId,
                userId,
                req.body
            );

            res.status(200).json(this.formatResponse(
                200,
                "Savings goal updated successfully",
                { savingsGoal: updatedGoal }
            ));
        } catch (err) {
            if ((err as Error).message === "Savings goal not found") {
                next(errorHandler(404, "Savings goal not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to update savings goal"));
        }
    }

    async deleteSavingsGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);
            const goalId = req.params.id;
            await this.expenseTrackerService.deleteSavingsGoal(goalId, userId);

            res.status(200).json(this.formatResponse(
                200,
                "Savings goal deleted successfully",
                null
            ));
        } catch (err) {
            if ((err as Error).message === "Savings goal not found") {
                next(errorHandler(404, "Savings goal not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete savings goal"));
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

    async getBudgetVsActual(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = this.getUserId(req);

            // Parse query parameters
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            let categoryIds: string[] | undefined = undefined;

            if (req.query.categoryIds) {
                if (typeof req.query.categoryIds === 'string') {
                    categoryIds = req.query.categoryIds.split(',');
                } else if (Array.isArray(req.query.categoryIds)) {
                    categoryIds = req.query.categoryIds as string[];
                }
            }

            const semesterId = req.query.semesterId as string | undefined;

            const comparison = await this.expenseTrackerService.getBudgetVsActual(userId, {
                startDate,
                endDate,
                categoryIds,
                semesterId
            });

            res.status(200).json(this.formatResponse(
                200,
                "Budget vs. actual comparison retrieved successfully",
                comparison
            ));
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to generate budget vs. actual comparison"));
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
