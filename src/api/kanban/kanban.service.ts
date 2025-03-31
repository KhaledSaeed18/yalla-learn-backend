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
    tags?: string[];
}

interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date | null;
    columnId?: string;
    tags?: string[];
}

interface UpdateBoardData {
    title?: string;
}

interface UpdateColumnData {
    title?: string;
    order?: number;
    isDefault?: boolean;
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
            { title: 'In Progress', order: 1, isDefault: false },
            { title: 'Done', order: 2, isDefault: false },
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
                    include: {
                        tasks: {
                            include: {
                                taskTags: {
                                    include: {
                                        tag: true,
                                    },
                                },
                            },
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
                            include: {
                                taskTags: {
                                    include: {
                                        tag: true,
                                    },
                                },
                            },
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

    public async updateBoard(boardId: string, data: UpdateBoardData, userId: string) {
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
            throw new Error('Unauthorized - You can only update your own boards');
        }

        return this.prisma.board.update({
            where: {
                id: boardId,
            },
            data,
            include: {
                columns: {
                    include: {
                        tasks: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });
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

    public async updateColumn(columnId: string, data: UpdateColumnData, userId: string) {
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
            throw new Error('Unauthorized - You can only update columns on your own boards');
        }

        return this.prisma.column.update({
            where: {
                id: columnId,
            },
            data,
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

        // Begin transaction for task creation and tags
        const task = await this.prisma.$transaction(async (tx) => {
            // Create the task
            const newTask = await tx.task.create({
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    dueDate: data.dueDate,
                    columnId,
                    userId,
                },
            });

            // Handle tags if provided
            if (data.tags && data.tags.length > 0) {
                for (const tagName of data.tags) {
                    // Find or create the tag
                    let tag = await tx.tag.findUnique({
                        where: { name: tagName },
                    });

                    if (!tag) {
                        tag = await tx.tag.create({
                            data: { name: tagName },
                        });
                    }

                    // Create the task-tag relationship
                    await tx.taskTag.create({
                        data: {
                            taskId: newTask.id,
                            tagId: tag.id,
                        },
                    });
                }
            }

            return newTask;
        });

        return this.getTaskById(task.id);
    }

    public async getTaskById(taskId: string) {
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
            include: {
                taskTags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        return task;
    }

    public async updateTask(taskId: string, data: UpdateTaskData, userId: string) {
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
                taskTags: true,
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.userId !== userId && task.column.board.userId !== userId) {
            throw new Error('Unauthorized - You can only update your own tasks');
        }

        // If moving to another column, verify the column is in the same board
        if (data.columnId && data.columnId !== task.columnId) {
            const targetColumn = await this.prisma.column.findUnique({
                where: {
                    id: data.columnId,
                },
                include: {
                    board: true,
                },
            });

            if (!targetColumn) {
                throw new Error('Target column not found');
            }

            if (targetColumn.board.id !== task.column.board.id) {
                throw new Error('Cannot move task to a column in a different board');
            }
        }

        // Begin transaction for task update and tags
        const updatedTask = await this.prisma.$transaction(async (tx) => {
            // Update the task
            const updated = await tx.task.update({
                where: {
                    id: taskId,
                },
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    dueDate: data.dueDate === null ? null : data.dueDate,
                    columnId: data.columnId,
                },
            });

            // Handle tags if provided
            if (data.tags) {
                // Delete existing task-tag relationships
                await tx.taskTag.deleteMany({
                    where: {
                        taskId,
                    },
                });

                // Create new task-tag relationships
                for (const tagName of data.tags) {
                    // Find or create the tag
                    let tag = await tx.tag.findUnique({
                        where: { name: tagName },
                    });

                    if (!tag) {
                        tag = await tx.tag.create({
                            data: { name: tagName },
                        });
                    }

                    // Create the task-tag relationship
                    await tx.taskTag.create({
                        data: {
                            taskId,
                            tagId: tag.id,
                        },
                    });
                }
            }

            return updated;
        });

        return this.getTaskById(updatedTask.id);
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
}