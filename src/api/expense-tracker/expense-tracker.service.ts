/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExpenseCategoryType, PaymentMethod, PrismaClient, Term, UniversityPaymentType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// DTOs for data transfer
interface CreateExpenseDTO {
    amount: number;
    description?: string | null;
    date: Date;
    category: ExpenseCategoryType;
    paymentMethod?: PaymentMethod | null;
    location?: string | null;
    semesterId?: string | null;
}

interface CreateIncomeDTO {
    amount: number;
    source: string;
    description?: string | null;
    date: Date;
    recurring?: boolean;
}

interface CreateSemesterDTO {
    name: string;
    startDate: Date;
    endDate: Date;
    year: number;
    term: Term;
    isActive?: boolean;
}

interface CreatePaymentScheduleDTO {
    name: string;
    amount: number;
    dueDate: Date;
    isPaid?: boolean;
    paidDate?: Date | null;
    semesterId: string;
    paymentType: UniversityPaymentType;
    notes?: string | null;
}

interface CreateSavingsGoalDTO {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    startDate?: Date;
    targetDate?: Date | null;
    isCompleted?: boolean;
}

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

export class ExpenseTrackerService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // ************************ EXPENSE METHODS ************************ //

    /**
     * Create a new expense for a user
     */
    async createExpense(userId: string, data: CreateExpenseDTO) {
        try {
            // Verify semester if provided
            if (data.semesterId) {
                const semester = await this.prisma.semester.findFirst({
                    where: {
                        id: data.semesterId,
                        userId,
                    },
                });

                if (!semester) {
                    throw new Error('Invalid semester');
                }
            }

            return this.prisma.expense.create({
                data: {
                    ...data,
                    userId,
                },
                include: {
                    semester: true,
                },
            });
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    }

    /**
     * Get expenses for a user with filtering and pagination
     */
    async getExpenses(userId: string, options: ExpenseFilterOptions = {}) {
        try {
            const {
                startDate,
                endDate,
                categories,
                semesterId,
                minAmount,
                maxAmount,
                paymentMethods,
                page = 1,
                limit = 10,
                sortBy = 'date',
                sortOrder = 'desc',
            } = options;

            const skip = (page - 1) * limit;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Date range filter
            if (startDate || endDate) {
                where.date = {};
                if (startDate) where.date.gte = startDate;
                if (endDate) where.date.lte = endDate;
            }

            // Category filter
            if (categories && categories.length > 0) {
                where.category = {
                    in: categories,
                };
            }

            // Semester filter
            if (semesterId) {
                where.semesterId = semesterId;
            }

            // Amount range filter
            if (minAmount !== undefined || maxAmount !== undefined) {
                where.amount = {};
                if (minAmount !== undefined) where.amount.gte = minAmount;
                if (maxAmount !== undefined) where.amount.lte = maxAmount;
            }

            // Payment method filter
            if (paymentMethods && paymentMethods.length > 0) {
                where.paymentMethod = {
                    in: paymentMethods,
                };
            }

            // Get total count for pagination
            const totalExpenses = await this.prisma.expense.count({ where });

            // Get expenses with filtering and sorting
            const expenses = await this.prisma.expense.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    semester: true,
                },
            });

            // Calculate pagination info
            const totalPages = Math.ceil(totalExpenses / limit);

            return {
                expenses,
                pagination: {
                    total: totalExpenses,
                    page,
                    limit,
                    pages: totalPages,
                },
            };
        } catch (error) {
            console.error('Error getting expenses:', error);
            throw error;
        }
    }

    /**
     * Get expense by ID
     */
    async getExpenseById(id: string, userId: string) {
        try {
            const expense = await this.prisma.expense.findFirst({
                where: {
                    id,
                    userId,
                },
                include: {
                    semester: true,
                },
            });

            if (!expense) {
                throw new Error('Expense not found');
            }

            return expense;
        } catch (error) {
            console.error('Error getting expense by ID:', error);
            throw error;
        }
    }

    /**
     * Update an expense
     */
    async updateExpense(id: string, userId: string, data: Partial<CreateExpenseDTO>) {
        try {
            // Check if expense exists and belongs to user
            const expense = await this.prisma.expense.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!expense) {
                throw new Error('Expense not found');
            }

            // Verify semester if changing
            if (data.semesterId && data.semesterId !== expense.semesterId) {
                const semester = await this.prisma.semester.findFirst({
                    where: {
                        id: data.semesterId,
                        userId,
                    },
                });

                if (!semester) {
                    throw new Error('Invalid semester');
                }
            }

            return this.prisma.expense.update({
                where: { id },
                data,
                include: {
                    semester: true,
                },
            });
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    /**
     * Delete an expense
     */
    async deleteExpense(id: string, userId: string) {
        try {
            // Check if expense exists and belongs to user
            const expense = await this.prisma.expense.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!expense) {
                throw new Error('Expense not found');
            }

            return this.prisma.expense.delete({
                where: { id },
            });
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    // ************************ INCOME METHODS ************************ //

    /**
     * Create a new income for a user
     */
    async createIncome(userId: string, data: CreateIncomeDTO) {
        try {
            return this.prisma.income.create({
                data: {
                    ...data,
                    userId,
                },
            });
        } catch (error) {
            console.error('Error creating income:', error);
            throw error;
        }
    }

    /**
     * Get income records for a user with filtering and pagination
     */
    async getIncomes(userId: string, options: IncomeFilterOptions = {}) {
        try {
            const {
                startDate,
                endDate,
                recurring,
                minAmount,
                maxAmount,
                page = 1,
                limit = 10,
                sortBy = 'date',
                sortOrder = 'desc',
            } = options;

            const skip = (page - 1) * limit;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Date range filter
            if (startDate || endDate) {
                where.date = {};
                if (startDate) where.date.gte = startDate;
                if (endDate) where.date.lte = endDate;
            }

            // Recurring filter
            if (recurring !== undefined) {
                where.recurring = recurring;
            }

            // Amount range filter
            if (minAmount !== undefined || maxAmount !== undefined) {
                where.amount = {};
                if (minAmount !== undefined) where.amount.gte = minAmount;
                if (maxAmount !== undefined) where.amount.lte = maxAmount;
            }

            // Get total count for pagination
            const totalIncomes = await this.prisma.income.count({ where });

            // Get incomes with filtering and sorting
            const incomes = await this.prisma.income.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            });

            // Calculate pagination info
            const totalPages = Math.ceil(totalIncomes / limit);

            return {
                incomes,
                pagination: {
                    total: totalIncomes,
                    page,
                    limit,
                    pages: totalPages,
                },
            };
        } catch (error) {
            console.error('Error getting incomes:', error);
            throw error;
        }
    }

    /**
     * Get income by ID
     */
    async getIncomeById(id: string, userId: string) {
        try {
            const income = await this.prisma.income.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!income) {
                throw new Error('Income record not found');
            }

            return income;
        } catch (error) {
            console.error('Error getting income by ID:', error);
            throw error;
        }
    }

    /**
     * Update an income record
     */
    async updateIncome(id: string, userId: string, data: Partial<CreateIncomeDTO>) {
        try {
            // Check if income exists and belongs to user
            const income = await this.prisma.income.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!income) {
                throw new Error('Income record not found');
            }

            return this.prisma.income.update({
                where: { id },
                data,
            });
        } catch (error) {
            console.error('Error updating income:', error);
            throw error;
        }
    }

    /**
     * Delete an income record
     */
    async deleteIncome(id: string, userId: string) {
        try {
            // Check if income exists and belongs to user
            const income = await this.prisma.income.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!income) {
                throw new Error('Income record not found');
            }

            return this.prisma.income.delete({
                where: { id },
            });
        } catch (error) {
            console.error('Error deleting income:', error);
            throw error;
        }
    }

    // ************************ SEMESTER METHODS ************************ //

    /**
     * Create a new semester
     */
    async createSemester(userId: string, data: CreateSemesterDTO) {
        try {
            // If setting this semester as active, deactivate other semesters
            if (data.isActive) {
                await this.prisma.semester.updateMany({
                    where: {
                        userId,
                        isActive: true,
                    },
                    data: {
                        isActive: false,
                    },
                });
            }

            return this.prisma.semester.create({
                data: {
                    ...data,
                    userId,
                },
            });
        } catch (error) {
            console.error('Error creating semester:', error);
            throw error;
        }
    }

    /**
     * Get all semesters for a user
     */
    async getSemesters(userId: string, options: {
        includeCompleted?: boolean;
        term?: Term;
        year?: number;
    } = {}) {
        try {
            const {
                includeCompleted = true,
                term,
                year,
            } = options;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Filter by term
            if (term) {
                where.term = term;
            }

            // Filter by year
            if (year) {
                where.year = year;
            }

            // Filter out completed semesters if requested
            if (!includeCompleted) {
                where.endDate = { gte: new Date() };
            }

            return this.prisma.semester.findMany({
                where,
                orderBy: [
                    { year: 'desc' },
                    { startDate: 'desc' },
                ],
                include: {
                    _count: {
                        select: {
                            expenses: true,
                            paymentSchedules: true,
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error getting semesters:', error);
            throw error;
        }
    }

    /**
     * Get semester by ID
     */
    async getSemesterById(id: string, userId: string) {
        try {
            const semester = await this.prisma.semester.findFirst({
                where: {
                    id,
                    userId,
                },
                include: {
                    _count: {
                        select: {
                            expenses: true,
                            paymentSchedules: true,
                        }
                    }
                }
            });

            if (!semester) {
                throw new Error('Semester not found');
            }

            return semester;
        } catch (error) {
            console.error('Error getting semester by ID:', error);
            throw error;
        }
    }

    /**
     * Get active semester for a user
     */
    async getActiveSemester(userId: string) {
        try {
            const activeSemester = await this.prisma.semester.findFirst({
                where: {
                    userId,
                    isActive: true,
                },
                include: {
                    _count: {
                        select: {
                            expenses: true,
                            paymentSchedules: true,
                        }
                    }
                }
            });

            return activeSemester;
        } catch (error) {
            console.error('Error getting active semester:', error);
            throw error;
        }
    }

    /**
     * Update a semester
     */
    async updateSemester(id: string, userId: string, data: Partial<CreateSemesterDTO>) {
        try {
            // Check if semester exists and belongs to user
            const semester = await this.prisma.semester.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!semester) {
                throw new Error('Semester not found');
            }

            // If setting this semester as active, deactivate other semesters
            if (data.isActive && !semester.isActive) {
                await this.prisma.semester.updateMany({
                    where: {
                        userId,
                        isActive: true,
                        id: { not: id },
                    },
                    data: {
                        isActive: false,
                    },
                });
            }

            return this.prisma.semester.update({
                where: { id },
                data,
            });
        } catch (error) {
            console.error('Error updating semester:', error);
            throw error;
        }
    }

    /**
     * Delete a semester
     */
    async deleteSemester(id: string, userId: string) {
        try {
            // Check if semester exists and belongs to user
            const semester = await this.prisma.semester.findFirst({
                where: {
                    id,
                    userId,
                },
                include: {
                    _count: {
                        select: {
                            expenses: true,
                            paymentSchedules: true,
                        }
                    }
                }
            });

            if (!semester) {
                throw new Error('Semester not found');
            }

            // Check if semester has related records
            if (semester._count.expenses > 0 ||
                semester._count.paymentSchedules > 0) {
                throw new Error('Cannot delete semester with associated records');
            }

            return this.prisma.semester.delete({
                where: { id },
            });
        } catch (error) {
            console.error('Error deleting semester:', error);
            throw error;
        }
    }

    // ************************ PAYMENT SCHEDULE METHODS ************************ //

    /**
     * Create a new payment schedule
     */
    async createPaymentSchedule(userId: string, data: CreatePaymentScheduleDTO) {
        try {
            // Verify the semester belongs to the user
            const semester = await this.prisma.semester.findFirst({
                where: {
                    id: data.semesterId,
                    userId,
                },
            });

            if (!semester) {
                throw new Error('Invalid semester');
            }

            return this.prisma.paymentSchedule.create({
                data: {
                    ...data,
                    userId,
                },
                include: {
                    semester: true,
                },
            });
        } catch (error) {
            console.error('Error creating payment schedule:', error);
            throw error;
        }
    }

    /**
     * Get payment schedules for a user
     */
    async getPaymentSchedules(userId: string, options: {
        semesterId?: string;
        isPaid?: boolean;
        paymentType?: UniversityPaymentType;
        upcoming?: boolean;
        overdue?: boolean;
    } = {}) {
        try {
            const {
                semesterId,
                isPaid,
                paymentType,
                upcoming,
                overdue,
            } = options;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Filter by semester
            if (semesterId) {
                where.semesterId = semesterId;
            }

            // Filter by payment status
            if (isPaid !== undefined) {
                where.isPaid = isPaid;
            }

            // Filter by payment type
            if (paymentType) {
                where.paymentType = paymentType;
            }

            // Filter for upcoming payments (due in the next 30 days)
            if (upcoming) {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now);
                thirtyDaysFromNow.setDate(now.getDate() + 30);

                where.AND = [
                    { isPaid: false },
                    { dueDate: { gte: now } },
                    { dueDate: { lte: thirtyDaysFromNow } },
                ];
            }

            // Filter for overdue payments
            if (overdue) {
                where.AND = [
                    { isPaid: false },
                    { dueDate: { lt: new Date() } },
                ];
            }

            return this.prisma.paymentSchedule.findMany({
                where,
                orderBy: { dueDate: 'asc' },
                include: {
                    semester: true,
                },
            });
        } catch (error) {
            console.error('Error getting payment schedules:', error);
            throw error;
        }
    }

    /**
     * Get payment schedule by ID
     */
    async getPaymentScheduleById(id: string, userId: string) {
        try {
            const paymentSchedule = await this.prisma.paymentSchedule.findFirst({
                where: {
                    id,
                    userId,
                },
                include: {
                    semester: true,
                },
            });

            if (!paymentSchedule) {
                throw new Error('Payment schedule not found');
            }

            return paymentSchedule;
        } catch (error) {
            console.error('Error getting payment schedule by ID:', error);
            throw error;
        }
    }

    /**
     * Update a payment schedule
     */
    async updatePaymentSchedule(id: string, userId: string, data: Partial<CreatePaymentScheduleDTO>) {
        try {
            // Check if payment schedule exists and belongs to user
            const paymentSchedule = await this.prisma.paymentSchedule.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!paymentSchedule) {
                throw new Error('Payment schedule not found');
            }

            // Verify the semester belongs to the user if changing
            if (data.semesterId && data.semesterId !== paymentSchedule.semesterId) {
                const semester = await this.prisma.semester.findFirst({
                    where: {
                        id: data.semesterId,
                        userId,
                    },
                });

                if (!semester) {
                    throw new Error('Invalid semester');
                }
            }

            // If marking as paid and no paidDate is provided, set it to now
            if (data.isPaid === true && !data.paidDate && !paymentSchedule.isPaid) {
                data.paidDate = new Date();
            }

            // If marking as unpaid, clear paidDate
            if (data.isPaid === false && paymentSchedule.isPaid) {
                data.paidDate = null;
            }

            return this.prisma.paymentSchedule.update({
                where: { id },
                data,
                include: {
                    semester: true,
                },
            });
        } catch (error) {
            console.error('Error updating payment schedule:', error);
            throw error;
        }
    }

    /**
     * Delete a payment schedule
     */
    async deletePaymentSchedule(id: string, userId: string) {
        try {
            // Check if payment schedule exists and belongs to user
            const paymentSchedule = await this.prisma.paymentSchedule.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!paymentSchedule) {
                throw new Error('Payment schedule not found');
            }

            return this.prisma.paymentSchedule.delete({
                where: { id },
            });
        } catch (error) {
            console.error('Error deleting payment schedule:', error);
            throw error;
        }
    }

    // ************************ SAVINGS GOAL METHODS ************************ //

    /**
     * Create a new savings goal
     */
    async createSavingsGoal(userId: string, data: CreateSavingsGoalDTO) {
        try {
            return this.prisma.savingsGoal.create({
                data: {
                    ...data,
                    userId,
                    startDate: data.startDate || new Date(),
                    currentAmount: data.currentAmount || 0,
                },
            });
        } catch (error) {
            console.error('Error creating savings goal:', error);
            throw error;
        }
    }

    /**
     * Get savings goals for a user
     */
    async getSavingsGoals(userId: string, options: {
        includeCompleted?: boolean;
    } = {}) {
        try {
            const {
                includeCompleted = true,
            } = options;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Filter by completion status
            if (!includeCompleted) {
                where.isCompleted = false;
            }

            return this.prisma.savingsGoal.findMany({
                where,
                orderBy: [
                    { isCompleted: 'asc' },
                    { targetDate: 'asc' },
                ],
            });
        } catch (error) {
            console.error('Error getting savings goals:', error);
            throw error;
        }
    }

    /**
     * Get savings goal by ID
     */
    async getSavingsGoalById(id: string, userId: string) {
        try {
            const savingsGoal = await this.prisma.savingsGoal.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!savingsGoal) {
                throw new Error('Savings goal not found');
            }

            return savingsGoal;
        } catch (error) {
            console.error('Error getting savings goal by ID:', error);
            throw error;
        }
    }

    /**
     * Update a savings goal
     */
    async updateSavingsGoal(id: string, userId: string, data: Partial<CreateSavingsGoalDTO>) {
        try {
            // Check if savings goal exists and belongs to user
            const savingsGoal = await this.prisma.savingsGoal.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!savingsGoal) {
                throw new Error('Savings goal not found');
            }

            // Check if updating currentAmount would complete the goal
            const updatedData = { ...data };
            if (data.currentAmount !== undefined) {
                const targetAmount = data.targetAmount || savingsGoal.targetAmount;
                const targetAmountNumber = targetAmount instanceof Decimal ? targetAmount.toNumber() : Number(targetAmount);

                // Auto-update isCompleted based on current amount vs target
                if (data.currentAmount >= targetAmountNumber) {
                    updatedData.isCompleted = true;
                } else if (data.isCompleted === undefined) {
                    updatedData.isCompleted = false;
                }
            }

            return this.prisma.savingsGoal.update({
                where: { id },
                data: updatedData,
            });
        } catch (error) {
            console.error('Error updating savings goal:', error);
            throw error;
        }
    }

    /**
     * Delete a savings goal
     */
    async deleteSavingsGoal(id: string, userId: string) {
        try {
            // Check if savings goal exists and belongs to user
            const savingsGoal = await this.prisma.savingsGoal.findFirst({
                where: {
                    id,
                    userId,
                },
            });

            if (!savingsGoal) {
                throw new Error('Savings goal not found');
            }

            return this.prisma.savingsGoal.delete({
                where: { id },
            });
        } catch (error) {
            console.error('Error deleting savings goal:', error);
            throw error;
        }
    }

    // ************************ REPORTS & STATISTICS ************************ //

    /**
     * Get expense summary by category for a specific time period
     */
    async getExpenseSummaryByCategory(userId: string, options: {
        startDate?: Date;
        endDate?: Date;
        semesterId?: string;
    } = {}) {
        try {
            const {
                startDate,
                endDate,
                semesterId,
            } = options;

            // Build filter conditions
            const where: any = {
                userId,
            };

            // Date range filter
            if (startDate || endDate) {
                where.date = {};
                if (startDate) where.date.gte = startDate;
                if (endDate) where.date.lte = endDate;
            }

            // Semester filter
            if (semesterId) {
                where.semesterId = semesterId;
            }

            // Get expenses
            const expenses = await this.prisma.expense.findMany({
                where,
            });

            // Calculate totals by category
            const categoryMap = new Map<string, {
                category: ExpenseCategoryType;
                total: number;
                count: number;
            }>();

            let totalAmount = 0;

            expenses.forEach(expense => {
                const category = expense.category;
                const categoryData = categoryMap.get(category) || {
                    category,
                    total: 0,
                    count: 0
                };

                const amount = expense.amount instanceof Decimal
                    ? expense.amount.toNumber()
                    : Number(expense.amount);

                categoryData.total += amount;
                categoryData.count += 1;
                totalAmount += amount;

                categoryMap.set(category, categoryData);
            });

            // Convert to array and add percentage
            const categorySummary = Array.from(categoryMap.values()).map(category => ({
                ...category,
                percentage: totalAmount > 0 ? (category.total / totalAmount) * 100 : 0,
            }));

            // Sort by total (highest first)
            categorySummary.sort((a, b) => b.total - a.total);

            return {
                categories: categorySummary,
                totalExpenses: totalAmount,
                expenseCount: expenses.length,
                timeframe: {
                    startDate: startDate || expenses.reduce(
                        (min, e) => (!min || e.date < min) ? e.date : min,
                        null as Date | null
                    ),
                    endDate: endDate || expenses.reduce(
                        (max, e) => (!max || e.date > max) ? e.date : max,
                        null as Date | null
                    ),
                },
            };
        } catch (error) {
            console.error('Error getting expense summary by category:', error);
            throw error;
        }
    }

    /**
     * Get expense vs. income comparison for a specific time period
     */
    async getExpenseIncomeComparison(userId: string, options: {
        startDate?: Date;
        endDate?: Date;
        groupBy: 'day' | 'week' | 'month' | 'year';
        semesterId?: string;
    }) {
        try {
            const {
                startDate,
                endDate,
                groupBy,
                semesterId,
            } = options;

            // Set default date range if not provided
            const now = new Date();
            const defaultStartDate = new Date();
            defaultStartDate.setMonth(now.getMonth() - 1);

            const effectiveStartDate = startDate || defaultStartDate;
            const effectiveEndDate = endDate || now;

            // Build expense filter
            const expenseWhere: any = {
                userId,
                date: {
                    gte: effectiveStartDate,
                    lte: effectiveEndDate,
                },
            };

            // Add semester filter for expenses if provided
            if (semesterId) {
                expenseWhere.semesterId = semesterId;
            }

            // Get expenses
            const expenses = await this.prisma.expense.findMany({
                where: expenseWhere,
                select: {
                    date: true,
                    amount: true,
                },
            });

            // Get incomes
            const incomes = await this.prisma.income.findMany({
                where: {
                    userId,
                    date: {
                        gte: effectiveStartDate,
                        lte: effectiveEndDate,
                    },
                },
                select: {
                    date: true,
                    amount: true,
                },
            });

            // Helper function to generate group key based on date and groupBy option
            const getGroupKey = (date: Date): string => {
                switch (groupBy) {
                    case 'day':
                        return date.toISOString().split('T')[0]; // YYYY-MM-DD
                    case 'week': {
                        const d = new Date(date);
                        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
                        const dayNumber = Math.floor((d.getTime() - firstDayOfYear.getTime()) / 86400000);
                        const weekNumber = Math.ceil((dayNumber + firstDayOfYear.getDay() + 1) / 7);
                        return `${d.getFullYear()}-W${weekNumber}`;
                    }
                    case 'month':
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    case 'year':
                        return `${date.getFullYear()}`;
                    default:
                        return date.toISOString().split('T')[0]; // Default to day
                }
            };

            // Function to generate all time periods between start and end dates
            const generateTimePeriods = (): string[] => {
                const periods: string[] = [];
                const currentDate = new Date(effectiveStartDate);

                while (currentDate <= effectiveEndDate) {
                    periods.push(getGroupKey(currentDate));

                    switch (groupBy) {
                        case 'day':
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                        case 'week':
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                        case 'month':
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                        case 'year':
                            currentDate.setFullYear(currentDate.getFullYear() + 1);
                            break;
                        default:
                            currentDate.setDate(currentDate.getDate() + 1);
                    }
                }

                return [...new Set(periods)]; // Remove duplicates
            };

            // Group expenses by time period
            const expensesByPeriod: Record<string, number> = {};
            expenses.forEach(expense => {
                const key = getGroupKey(expense.date);
                const amount = expense.amount instanceof Decimal
                    ? expense.amount.toNumber()
                    : Number(expense.amount);

                expensesByPeriod[key] = (expensesByPeriod[key] || 0) + amount;
            });

            // Group incomes by time period
            const incomesByPeriod: Record<string, number> = {};
            incomes.forEach(income => {
                const key = getGroupKey(income.date);
                const amount = income.amount instanceof Decimal
                    ? income.amount.toNumber()
                    : Number(income.amount);

                incomesByPeriod[key] = (incomesByPeriod[key] || 0) + amount;
            });

            // Generate all periods between start and end date
            const allPeriods = generateTimePeriods();

            // Calculate totals
            const totalExpenses = expenses.reduce((sum, e) => {
                const amount = e.amount instanceof Decimal ? e.amount.toNumber() : Number(e.amount);
                return sum + amount;
            }, 0);

            const totalIncome = incomes.reduce((sum, i) => {
                const amount = i.amount instanceof Decimal ? i.amount.toNumber() : Number(i.amount);
                return sum + amount;
            }, 0);

            // Create the result data structure
            const comparison = allPeriods.map(period => {
                return {
                    period,
                    expenses: expensesByPeriod[period] || 0,
                    income: incomesByPeriod[period] || 0,
                    net: (incomesByPeriod[period] || 0) - (expensesByPeriod[period] || 0),
                };
            });

            return {
                comparison,
                summary: {
                    totalExpenses,
                    totalIncome,
                    netSavings: totalIncome - totalExpenses,
                    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
                },
                timeframe: {
                    startDate: effectiveStartDate,
                    endDate: effectiveEndDate,
                    groupBy,
                },
            };
        } catch (error) {
            console.error('Error getting expense/income comparison:', error);
            throw error;
        }
    }

    /**
     * Get key financial stats for dashboard
     */
    async getDashboardStats(userId: string, options: {
        period: 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'all-time' | 'custom';
        startDate?: Date;
        endDate?: Date;
        semesterId?: string;
    }) {
        try {
            const { period, semesterId } = options;

            // Determine date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate: Date = now;

            switch (period) {
                case 'this-month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'last-month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'this-year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'last-year':
                    startDate = new Date(now.getFullYear() - 1, 0, 1);
                    endDate = new Date(now.getFullYear(), 0, 0);
                    break;
                case 'all-time':
                    startDate = new Date(0); // Beginning of time (Jan 1, 1970)
                    break;
                case 'custom':
                    if (!options.startDate || !options.endDate) {
                        throw new Error('startDate and endDate required for custom period');
                    }
                    startDate = options.startDate;
                    endDate = options.endDate;
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }

            // Build expense filter
            const expenseWhere: any = {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            };

            if (semesterId) {
                expenseWhere.semesterId = semesterId;
            }

            // Get total expenses
            const expenses = await this.prisma.expense.findMany({
                where: expenseWhere,
                select: {
                    amount: true,
                    date: true,
                },
            });

            const totalExpenses = expenses.reduce((sum, e) => {
                const amount = e.amount instanceof Decimal ? e.amount.toNumber() : Number(e.amount);
                return sum + amount;
            }, 0);

            // Get total income
            const income = await this.prisma.income.findMany({
                where: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    amount: true,
                    date: true,
                },
            });

            const totalIncome = income.reduce((sum, i) => {
                const amount = i.amount instanceof Decimal ? i.amount.toNumber() : Number(i.amount);
                return sum + amount;
            }, 0);

            // Get top expense categories
            const categoryExpenses = await this.getExpenseSummaryByCategory(userId, {
                startDate,
                endDate,
                semesterId,
            });

            // Get upcoming payments
            const upcomingPayments = await this.getPaymentSchedules(userId, {
                isPaid: false,
                upcoming: true,
            });

            // Get overdue payments
            const overduePayments = await this.getPaymentSchedules(userId, {
                isPaid: false,
                overdue: true,
            });

            // Get active semester
            const activeSemester = await this.getActiveSemester(userId);

            // Get savings goals progress
            const savingsGoals = await this.getSavingsGoals(userId, {
                includeCompleted: false,
            });

            // Calculate average daily expense
            const uniqueDays = new Set(expenses.map(e => e.date.toISOString().split('T')[0])).size;
            const avgDailyExpense = uniqueDays > 0 ? totalExpenses / uniqueDays : totalExpenses;

            return {
                summary: {
                    totalIncome,
                    totalExpenses,
                    netSavings: totalIncome - totalExpenses,
                    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
                },
                insights: {
                    avgDailyExpense,
                    topCategory: categoryExpenses.categories.length > 0 ? categoryExpenses.categories[0] : null,
                    upcomingPaymentsCount: upcomingPayments.length,
                    upcomingPaymentsTotal: upcomingPayments.reduce((sum, p) => {
                        const amount = p.amount instanceof Decimal ? p.amount.toNumber() : Number(p.amount);
                        return sum + amount;
                    }, 0),
                    overduePaymentsCount: overduePayments.length,
                    overduePaymentsTotal: overduePayments.reduce((sum, p) => {
                        const amount = p.amount instanceof Decimal ? p.amount.toNumber() : Number(p.amount);
                        return sum + amount;
                    }, 0),
                },
                context: {
                    period,
                    startDate,
                    endDate,
                    activeSemester,
                    savingsGoals: savingsGoals.slice(0, 3), // Top 3 savings goals
                },
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }
}
