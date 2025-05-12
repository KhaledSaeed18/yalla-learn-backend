import { Request, Response, NextFunction } from 'express';
import KanbanService from './kanban.service';
import { errorHandler } from '../../utils/errorHandler';

export default class KanbanController {
    private kanbanService: KanbanService;

    constructor() {
        this.kanbanService = new KanbanService();
        this.createBoard = this.createBoard.bind(this);
        this.getBoards = this.getBoards.bind(this);
        this.getBoardById = this.getBoardById.bind(this);
        this.deleteBoard = this.deleteBoard.bind(this);
        this.createColumn = this.createColumn.bind(this);
        this.deleteColumn = this.deleteColumn.bind(this);
        this.createTask = this.createTask.bind(this);
        this.getTaskById = this.getTaskById.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
    }

    // Board methods
    async createBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { title } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            const board = await this.kanbanService.createBoard({ title }, userId);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Board created successfully",
                data: { board }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to create board"));
        }
    }

    async getBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            const boards = await this.kanbanService.getBoards(userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Boards retrieved successfully",
                data: { boards }
            });
        } catch (err) {
            next(errorHandler(500, (err as Error).message || "Failed to retrieve boards"));
        }
    }

    async getBoardById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            const board = await this.kanbanService.getBoardById(id);

            // Check if the board belongs to the user
            if (board.userId !== req.user.userId) {
                return next(errorHandler(403, "Unauthorized - You can only view your own boards"));
            }

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Board retrieved successfully",
                data: { board }
            });
        } catch (err) {
            if ((err as Error).message === "Board not found") {
                next(errorHandler(404, "Board not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve board"));
        }
    }

    async deleteBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            await this.kanbanService.deleteBoard(id, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Board deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Board not found") {
                next(errorHandler(404, "Board not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete board"));
        }
    }

    // Column methods
    async createColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { boardId } = req.params;
            const { title, isDefault, order } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            const column = await this.kanbanService.createColumn(boardId, { title, isDefault, order }, userId);

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Column created successfully",
                data: { column }
            });
        } catch (err) {
            if ((err as Error).message === "Board not found") {
                next(errorHandler(404, "Board not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create column"));
        }
    }

    async deleteColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            await this.kanbanService.deleteColumn(id, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Column deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Column not found") {
                next(errorHandler(404, "Column not found"));
                return;
            }
            if ((err as Error).message === "Cannot delete the default column") {
                next(errorHandler(400, "Cannot delete the default column"));
                return;
            }
            if ((err as Error).message === "Cannot delete a column that contains tasks") {
                next(errorHandler(400, "Cannot delete a column that contains tasks"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete column"));
        }
    }

    // Task methods
    async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { columnId } = req.params;
            const { title, description, priority, dueDate } = req.body;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            const task = await this.kanbanService.createTask(
                columnId,
                { title, description, priority, dueDate: dueDate ? new Date(dueDate) : undefined },
                userId
            );

            res.status(201).json({
                status: "success",
                statusCode: 201,
                message: "Task created successfully",
                data: { task }
            });
        } catch (err) {
            if ((err as Error).message === "Column not found") {
                next(errorHandler(404, "Column not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to create task"));
        }
    }

    async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }

            const task = await this.kanbanService.getTaskById(id);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Task retrieved successfully",
                data: { task }
            });
        } catch (err) {
            if ((err as Error).message === "Task not found") {
                next(errorHandler(404, "Task not found"));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to retrieve task"));
        }
    }

    async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.user) {
                return next(errorHandler(401, "Authentication required"));
            }
            const userId = req.user.userId;

            await this.kanbanService.deleteTask(id, userId);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                message: "Task deleted successfully"
            });
        } catch (err) {
            if ((err as Error).message === "Task not found") {
                next(errorHandler(404, "Task not found"));
                return;
            }
            if ((err as Error).message.includes("Unauthorized")) {
                next(errorHandler(403, (err as Error).message));
                return;
            }
            next(errorHandler(500, (err as Error).message || "Failed to delete task"));
        }
    }
}