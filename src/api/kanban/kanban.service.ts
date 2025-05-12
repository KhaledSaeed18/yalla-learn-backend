import { PrismaClient, TaskPriority } from '@prisma/client';

interface CreateBoardData {
    title: string;
}

interface CreateColumnData {
    title: string;
    isDefault?: boolean;
    order?: number;
}

interface CreateTaskData {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: Date;
}

export default class KanbanService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Board operations
    public async createBoard(data: CreateBoardData, userId: string) {
        const board = await this.prisma.board.create({
            data: {
                title: data.title,
                userId,
            },
        });

        // Create default columns
        const defaultColumns = [
            { title: 'Todo', order: 0, isDefault: true },
            { title: 'In Progress', order: 1, isDefault: true },
            { title: 'Done', order: 2, isDefault: true },
        ];

        for (const column of defaultColumns) {
            await this.prisma.column.create({
                data: {
                    ...column,
                    boardId: board.id,
                },
            });
        }

        return this.getBoardById(board.id);
    }

    public async getBoards(userId: string) {
        return this.prisma.board.findMany({
            where: {
                userId,
            },
            include: {
                columns: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    }

    public async getBoardById(boardId: string) {
        const board = await this.prisma.board.findUnique({
            where: {
                id: boardId,
            },
            include: {
                columns: {
                    include: {
                        tasks: {
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        if (!board) {
            throw new Error('Board not found');
        }

        return board;
    }

    public async deleteBoard(boardId: string, userId: string) {
        // Check ownership
        const board = await this.prisma.board.findUnique({
            where: {
                id: boardId,
            },
        });

        if (!board) {
            throw new Error('Board not found');
        }

        if (board.userId !== userId) {
            throw new Error('Unauthorized - You can only delete your own boards');
        }

        return this.prisma.board.delete({
            where: {
                id: boardId,
            },
        });
    }

    // Column operations
    public async createColumn(boardId: string, data: CreateColumnData, userId: string) {
        // Check ownership
        const board = await this.prisma.board.findUnique({
            where: {
                id: boardId,
            },
        });

        if (!board) {
            throw new Error('Board not found');
        }

        if (board.userId !== userId) {
            throw new Error('Unauthorized - You can only add columns to your own boards');
        }

        // If order not provided, put at the end
        if (data.order === undefined) {
            const lastColumn = await this.prisma.column.findFirst({
                where: {
                    boardId,
                },
                orderBy: {
                    order: 'desc',
                },
            });

            data.order = lastColumn ? lastColumn.order + 1 : 0;
        }

        return this.prisma.column.create({
            data: {
                title: data.title,
                order: data.order,
                isDefault: data.isDefault || false,
                boardId,
            },
        });
    }

    public async deleteColumn(columnId: string, userId: string) {
        // Check ownership
        const column = await this.prisma.column.findUnique({
            where: {
                id: columnId,
            },
            include: {
                board: true,
                tasks: {
                    take: 1,
                },
            },
        });

        if (!column) {
            throw new Error('Column not found');
        }

        if (column.board.userId !== userId) {
            throw new Error('Unauthorized - You can only delete columns on your own boards');
        }

        if (column.isDefault) {
            throw new Error('Cannot delete the default column');
        }

        if (column.tasks.length > 0) {
            throw new Error('Cannot delete a column that contains tasks');
        }

        return this.prisma.column.delete({
            where: {
                id: columnId,
            },
        });
    }

    // Task operations
    public async createTask(columnId: string, data: CreateTaskData, userId: string) {
        // Check ownership
        const column = await this.prisma.column.findUnique({
            where: {
                id: columnId,
            },
            include: {
                board: true,
            },
        });

        if (!column) {
            throw new Error('Column not found');
        }

        if (column.board.userId !== userId) {
            throw new Error('Unauthorized - You can only add tasks to your own boards');
        }

        // Create the task
        const task = await this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                dueDate: data.dueDate,
                columnId,
                userId,
            },
        });

        return this.getTaskById(task.id);
    }

    public async getTaskById(taskId: string) {
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            }
        });

        if (!task) {
            throw new Error('Task not found');
        }

        return task;
    }

    public async deleteTask(taskId: string, userId: string) {
        // Check ownership
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
            include: {
                column: {
                    include: {
                        board: true,
                    },
                },
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.userId !== userId && task.column.board.userId !== userId) {
            throw new Error('Unauthorized - You can only delete your own tasks');
        }

        return this.prisma.task.delete({
            where: {
                id: taskId,
            },
        });
    }

    // Move task to another column
    public async moveTask(taskId: string, targetColumnId: string, userId: string) {
        // Check if task exists
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
            include: {
                column: {
                    include: {
                        board: true,
                    },
                },
            },
        });

        if (!task) {
            throw new Error("Task not found");
        }

        // Check ownership of the task
        if (task.userId !== userId && task.column.board.userId !== userId) {
            throw new Error("Unauthorized: You don't have permission to move this task");
        }

        // Check if target column exists
        const targetColumn = await this.prisma.column.findUnique({
            where: {
                id: targetColumnId,
            },
            include: {
                board: true,
            },
        });

        if (!targetColumn) {
            throw new Error("Target column not found");
        }

        // Check if target column belongs to the same board
        if (targetColumn.boardId !== task.column.boardId) {
            throw new Error("Cannot move task to a column in a different board");
        }

        // Update the task with the new column
        return this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                columnId: targetColumnId,
                updatedAt: new Date(), // Explicitly update the timestamp
            },
        });
    }
}