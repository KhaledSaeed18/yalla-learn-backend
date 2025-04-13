import express from 'express';
import ReportController from './reports.controller';
import {
    createReportLimiter,
    getReportsLimiter,
    deleteReportLimiter,
    adminReportLimiter
} from './reports.rateLimiting';
import { authorize } from '../../middlewares/authorization.middleware';

const router = express.Router();
const reportController = new ReportController();

// Create a new report
router.post(
    '/',
    authorize,
    createReportLimiter,
    reportController.createReport.bind(reportController)
);

// Get all reports (filtered by user if not admin)
router.get(
    '/',
    authorize,
    getReportsLimiter,
    reportController.getReports.bind(reportController)
);

// Get report by ID
router.get(
    '/:id',
    authorize,
    getReportsLimiter,
    reportController.getReportById.bind(reportController)
);

// Delete a report
router.delete(
    '/:id',
    authorize,
    deleteReportLimiter,
    reportController.deleteReport.bind(reportController)
);

// Update report status (admin only)
router.patch(
    '/:id/status',
    authorize,
    adminReportLimiter,
    reportController.updateReportStatus.bind(reportController)
);

export default router;
