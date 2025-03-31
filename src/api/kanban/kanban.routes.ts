import express from 'express';
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

const router = express.Router();
const kanbanController = new KanbanController();

// Board routes
router.post(
    '/boards',
    authorize,
    boardCreateLimiter,
    createBoardValidation,
    kanbanController.createBoard
);

router.get(
    '/boards',
    authorize,
    boardGetLimiter,
    kanbanController.getBoards
);

router.get(
    '/boards/:id',
    authorize,
    boardGetLimiter,
    boardIdValidation,
    kanbanController.getBoardById
);

router.put(
    '/boards/:id',
    authorize,
    boardUpdateLimiter,
    updateBoardValidation,
    kanbanController.updateBoard
);

router.delete(
    '/boards/:id',
    authorize,
    boardDeleteLimiter,
    boardIdValidation,
    kanbanController.deleteBoard
);

// Column routes
router.post(
    '/boards/:boardId/columns',
    authorize,
    columnCreateLimiter,
    createColumnValidation,
    kanbanController.createColumn
);

router.put(
    '/columns/:id',
    authorize,
    columnUpdateLimiter,
    updateColumnValidation,
    kanbanController.updateColumn
);

router.delete(
    '/columns/:id',
    authorize,
    columnDeleteLimiter,
    columnIdValidation,
    kanbanController.deleteColumn
);

// Task routes
router.post(
    '/columns/:columnId/tasks',
    authorize,
    taskCreateLimiter,
    createTaskValidation,
    kanbanController.createTask
);

router.get(
    '/tasks/:id',
    authorize,
    taskGetLimiter,
    taskIdValidation,
    kanbanController.getTaskById
);

router.put(
    '/tasks/:id',
    authorize,
    taskUpdateLimiter,
    updateTaskValidation,
    kanbanController.updateTask
);

router.delete(
    '/tasks/:id',
    authorize,
    taskDeleteLimiter,
    taskIdValidation,
    kanbanController.deleteTask
);

export default router;