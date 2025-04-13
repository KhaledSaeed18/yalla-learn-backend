import { Router } from "express";
import ExpenseTrackerController from "./expense-tracker.controller";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from "../../middlewares/sanitizeBody.middleware";
import {
    createExpenseTrackerLimiter,
    modifyExpenseTrackerLimiter,
    reportExpenseTrackerLimiter,
    standardExpenseTrackerLimiter
} from "./expense-tracker.rateLimiting";
import {
    validateBudget,
    validateExpense,
    validateExpenseCategory,
    validateIncome,
    validatePaymentSchedule,
    validateSavingsGoal,
    validateSemester,
    validateExpenseFilters,
    validateIncomeFilters,
    validateBudgetComparison,
    validateExpenseIncomeComparison,
    validateDashboardStats
} from "./expense-tracker.validation";

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

        // Expense Category routes
        this.router.post(
            "/categories",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpenseCategory,
            this.expenseTrackerController.createExpenseCategory
        );

        this.router.get(
            "/categories",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getExpenseCategories
        );

        this.router.get(
            "/categories/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getExpenseCategoryById
        );

        this.router.put(
            "/categories/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpenseCategory,
            this.expenseTrackerController.updateExpenseCategory
        );

        this.router.delete(
            "/categories/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteExpenseCategory
        );

        // Expense routes
        this.router.post(
            "/expenses",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpense,
            this.expenseTrackerController.createExpense
        );

        this.router.get(
            "/expenses",
            standardExpenseTrackerLimiter,
            validateExpenseFilters,
            this.expenseTrackerController.getExpenses
        );

        this.router.get(
            "/expenses/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getExpenseById
        );

        this.router.put(
            "/expenses/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateExpense,
            this.expenseTrackerController.updateExpense
        );

        this.router.delete(
            "/expenses/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteExpense
        );

        // Income routes
        this.router.post(
            "/incomes",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateIncome,
            this.expenseTrackerController.createIncome
        );

        this.router.get(
            "/incomes",
            standardExpenseTrackerLimiter,
            validateIncomeFilters,
            this.expenseTrackerController.getIncomes
        );

        this.router.get(
            "/incomes/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getIncomeById
        );

        this.router.put(
            "/incomes/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateIncome,
            this.expenseTrackerController.updateIncome
        );

        this.router.delete(
            "/incomes/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteIncome
        );

        // Budget routes
        this.router.post(
            "/budgets",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateBudget,
            this.expenseTrackerController.createBudget
        );

        this.router.get(
            "/budgets",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getBudgets
        );

        this.router.get(
            "/budgets/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getBudgetById
        );

        this.router.put(
            "/budgets/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateBudget,
            this.expenseTrackerController.updateBudget
        );

        this.router.delete(
            "/budgets/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteBudget
        );

        // Semester routes
        this.router.post(
            "/semesters",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSemester,
            this.expenseTrackerController.createSemester
        );

        this.router.get(
            "/semesters",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSemesters
        );

        this.router.get(
            "/semesters/active",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getActiveSemester
        );

        this.router.get(
            "/semesters/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSemesterById
        );

        this.router.put(
            "/semesters/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSemester,
            this.expenseTrackerController.updateSemester
        );

        this.router.delete(
            "/semesters/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deleteSemester
        );

        // Payment Schedule routes
        this.router.post(
            "/payment-schedules",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validatePaymentSchedule,
            this.expenseTrackerController.createPaymentSchedule
        );

        this.router.get(
            "/payment-schedules",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getPaymentSchedules
        );

        this.router.get(
            "/payment-schedules/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getPaymentScheduleById
        );

        this.router.put(
            "/payment-schedules/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validatePaymentSchedule,
            this.expenseTrackerController.updatePaymentSchedule
        );

        this.router.delete(
            "/payment-schedules/:id",
            modifyExpenseTrackerLimiter,
            this.expenseTrackerController.deletePaymentSchedule
        );

        // Savings Goal routes
        this.router.post(
            "/savings-goals",
            createExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSavingsGoal,
            this.expenseTrackerController.createSavingsGoal
        );

        this.router.get(
            "/savings-goals",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSavingsGoals
        );

        this.router.get(
            "/savings-goals/:id",
            standardExpenseTrackerLimiter,
            this.expenseTrackerController.getSavingsGoalById
        );

        this.router.put(
            "/savings-goals/:id",
            modifyExpenseTrackerLimiter,
            sanitizeRequestBody,
            validateSavingsGoal,
            this.expenseTrackerController.updateSavingsGoal
        );

        this.router.delete(
            "/savings-goals/:id",
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
            "/reports/budget-vs-actual",
            reportExpenseTrackerLimiter,
            validateBudgetComparison,
            this.expenseTrackerController.getBudgetVsActual
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
