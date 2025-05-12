import { Router } from 'express';
import KanbanController from './kanban.controller';
import { createBoardValidation, boardIdValidation, createColumnValidation, columnIdValidation, createTaskValidation, taskIdValidation } from './kanban.validation';
import { boardCreateLimiter, boardGetLimiter, boardDeleteLimiter, columnCreateLimiter, columnDeleteLimiter, taskCreateLimiter, taskGetLimiter, taskDeleteLimiter } from './kanban.rateLimiting';
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
            '/create-board',
            authorize,
            boardCreateLimiter,
            createBoardValidation,
            this.kanbanController.createBoard
        );

        this.router.get(
            '/get-boards',
            authorize,
            boardGetLimiter,
            this.kanbanController.getBoards
        );

        this.router.get(
            '/get-board/:id',
            authorize,
            boardGetLimiter,
            boardIdValidation,
            this.kanbanController.getBoardById
        );

        this.router.delete(
            '/delete-board/:id',
            authorize,
            boardDeleteLimiter,
            boardIdValidation,
            this.kanbanController.deleteBoard
        );

        // Column routes
        this.router.post(
            '/boards/:boardId/create-column',
            authorize,
            columnCreateLimiter,
            createColumnValidation,
            this.kanbanController.createColumn
        );

        this.router.delete(
            '/delete-column/:id',
            authorize,
            columnDeleteLimiter,
            columnIdValidation,
            this.kanbanController.deleteColumn
        );

        // Task routes
        this.router.post(
            '/column/:columnId/create-task',
            authorize,
            taskCreateLimiter,
            createTaskValidation,
            this.kanbanController.createTask
        );

        this.router.get(
            '/get-task/:id',
            authorize,
            taskGetLimiter,
            taskIdValidation,
            this.kanbanController.getTaskById
        );

        this.router.delete(
            '/delete-task/:id',
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