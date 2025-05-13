import { Router } from "express";
import ExpenseTrackerController from "./expense-tracker.controller";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from "../../middlewares/sanitizeBody.middleware";
import { createExpenseTrackerLimiter, modifyExpenseTrackerLimiter, reportExpenseTrackerLimiter, standardExpenseTrackerLimiter } from "./expense-tracker.rateLimiting";
import { validateExpense, validateIncome, validatePaymentSchedule, validateSavingsGoal, validateSemester, validateExpenseFilters, validateIncomeFilters, validateExpenseIncomeComparison, validateDashboardStats } from "./expense-tracker.validation";

export default class ExpenseTrackerRouter {
    private router: Router;
    private expenseTrackerController: ExpenseTrackerController;

    constructor() {
        this.router = Router();
        this.expenseTrackerController = new ExpenseTrackerController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Apply authorize middleware to all routes
        this.router.use(authorize);

        // Expense routes
        this.router.post(
            "/create-expense",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpense,
            this.expenseTrackerController.createExpense
        );

        this.router.get(
            "/get-expenses",
            standardExpenseTrackerLimiter,
            validateExpenseFilters,
            this.expenseTrackerController.getExpenses
        );

        this.router.get(
            "/get-expense/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getExpenseById
        );

        this.router.put(
            "/update-expense/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpense,
            this.expenseTrackerController.updateExpense
        );

        this.router.delete(
            "/delete-expense/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteExpense
        );

        // Income routes
        this.router.post(
            "/create-income",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateIncome,
            this.expenseTrackerController.createIncome
        );

        this.router.get(
            "/get-incomes",
            standardExpenseTrackerLimiter,
            validateIncomeFilters,
            this.expenseTrackerController.getIncomes
        );

        this.router.get(
            "/get-income/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getIncomeById
        );

        this.router.put(
            "/update-income/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateIncome,
            this.expenseTrackerController.updateIncome
        );

        this.router.delete(
            "/delete-income/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteIncome
        );

        // Semester routes
        this.router.post(
            "/create-semester",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSemester,
            this.expenseTrackerController.createSemester
        );

        this.router.get(
            "/get-semesters",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSemesters
        );

        this.router.get(
            "/semesters/active",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getActiveSemester
        );

        this.router.get(
            "/get-semester/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSemesterById
        );

        this.router.put(
            "/update-semester/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSemester,
            this.expenseTrackerController.updateSemester
        );

        this.router.delete(
            "/delete-semester/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteSemester
        );

        // Payment Schedule routes
        this.router.post(
            "/create-payment-schedule",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validatePaymentSchedule,
            this.expenseTrackerController.createPaymentSchedule
        );

        this.router.get(
            "/get-payment-schedules",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getPaymentSchedules
        );

        this.router.get(
            "/get-payment-schedule/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getPaymentScheduleById
        );

        this.router.put(
            "/update-payment-schedule/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validatePaymentSchedule,
            this.expenseTrackerController.updatePaymentSchedule
        );

        this.router.delete(
            "/delete-payment-schedule/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deletePaymentSchedule
        );

        // Savings Goal routes
        this.router.post(
            "/create-savings-goals",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSavingsGoal,
            this.expenseTrackerController.createSavingsGoal
        );

        this.router.get(
            "/get-savings-goals",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSavingsGoals
        );

        this.router.get(
            "/get-savings-goal/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSavingsGoalById
        );

        this.router.put(
            "/update-savings-goal/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSavingsGoal,
            this.expenseTrackerController.updateSavingsGoal
        );

        this.router.delete(
            "/delete-savings-goal/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteSavingsGoal
        );

        // Reports & Statistics routes
        this.router.get(
            "/reports/expense-summary",
            reportExpenseTrackerLimiter,
            this.expenseTrackerController.getExpenseSummaryByCategory
        );

        this.router.get(
            "/reports/expense-income-comparison",
            reportExpenseTrackerLimiter,
            validateExpenseIncomeComparison,
            this.expenseTrackerController.getExpenseIncomeComparison
        );

        this.router.get(
            "/dashboard/stats",
            reportExpenseTrackerLimiter,
            validateDashboardStats,
            this.expenseTrackerController.getDashboardStats
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}
