import { Router } from 'express';
import KanbanController from './kanban.controller';
import {
    createBoardValidation,
    updateBoardValidation,
    boardIdValidation,
    createColumnValidation,
    updateColumnValidation,
    columnIdValidation,
    createTaskValidation,
    updateTaskValidation,
    taskIdValidation
} from './kanban.validation';
import {
    boardCreateLimiter,
    boardGetLimiter,
    boardUpdateLimiter,
    boardDeleteLimiter,
    columnCreateLimiter,
    columnUpdateLimiter,
    columnDeleteLimiter,
    taskCreateLimiter,
    taskGetLimiter,
    taskUpdateLimiter,
    taskDeleteLimiter
} from './kanban.rateLimiting';
import { authorize } from '../../middlewares/authorization.middleware';

export default class KanbanRouter {
    private router: Router;
    private kanbanController: KanbanController;

    constructor() {
        this.router = Router();
        this.kanbanController = new KanbanController();
        this.initRoutes();
    }

    private initRoutes(): void {
        // Board routes
        this.router.post(
            '/boards',
            authorize,
            boardCreateLimiter,
            createBoardValidation,
            this.kanbanController.createBoard
        );

        this.router.get(
            '/boards',
            authorize,
            boardGetLimiter,
            this.kanbanController.getBoards
        );

        this.router.get(
            '/boards/:id',
            authorize,
            boardGetLimiter,
            boardIdValidation,
            this.kanbanController.getBoardById
        );

        this.router.put(
            '/boards/:id',
            authorize,
            boardUpdateLimiter,
            updateBoardValidation,
            this.kanbanController.updateBoard
        );

        this.router.delete(
            '/boards/:id',
            authorize,
            boardDeleteLimiter,
            boardIdValidation,
            this.kanbanController.deleteBoard
        );

        // Column routes
        this.router.post(
            '/boards/:boardId/columns',
            authorize,
            columnCreateLimiter,
            createColumnValidation,
            this.kanbanController.createColumn
        );

        this.router.put(
            '/columns/:id',
            authorize,
            columnUpdateLimiter,
            updateColumnValidation,
            this.kanbanController.updateColumn
        );

        this.router.delete(
            '/columns/:id',
            authorize,
            columnDeleteLimiter,
            columnIdValidation,
            this.kanbanController.deleteColumn
        );

        // Task routes
        this.router.post(
            '/columns/:columnId/tasks',
            authorize,
            taskCreateLimiter,
            createTaskValidation,
            this.kanbanController.createTask
        );

        this.router.get(
            '/tasks/:id',
            authorize,
            taskGetLimiter,
            taskIdValidation,
            this.kanbanController.getTaskById
        );

        this.router.put(
            '/tasks/:id',
            authorize,
            taskUpdateLimiter,
            updateTaskValidation,
            this.kanbanController.updateTask
        );

        this.router.delete(
            '/tasks/:id',
            authorize,
            taskDeleteLimiter,
            taskIdValidation,
            this.kanbanController.deleteTask
        );
    }

    // Returns the router object
    public getRouter(): Router {
        return this.router;
    }
}