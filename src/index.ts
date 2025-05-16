import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { ErrorMiddleware } from './middlewares/error.middleware';
import { securityHeaders } from './middlewares/securityHeaders.middleware';

import AuthRouter from './api/auth/auth.routes';
import BlogRouter from './api/blog/blog.routes';
import UserRouter from './api/user/user.routes';
import QARouter from './api/qa/qa.routes';
import KanbanRouter from './api/kanban/kanban.routes';
import ListingRouter from './api/listings/listings.routes';
import ChatRouter from './api/chat/chat.routes';
import ServiceRouter from './api/services/services.routes';
import ExpenseTrackerRouter from './api/expense-tracker/expense-tracker.routes';
import ContactRouter from './api/contact/contact.routes';
import JobRouter from './api/jobs/jobs.routes';

dotenv.config();

const app: Express = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://www.yalla-learn.me"
];

// CORS middleware
app.use(
    cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Security middleware
app.use(securityHeaders);

// Body parser middleware
app.use(express.json());

const port = process.env.PORT;
const version = process.env.API_VERSION!;
const baseUrl = `${process.env.BASE_URL!}/${version}`;

// Authentication routes
const authRouter = new AuthRouter();
app.use(`${baseUrl}/auth`, authRouter.getRouter());

// Blog routes
const blogRouter = new BlogRouter();
app.use(`${baseUrl}/blog`, blogRouter.getRouter());

// User routes
const userRouter = new UserRouter();
app.use(`${baseUrl}/users`, userRouter.getRouter());

// QA routes
const qaRouter = new QARouter();
app.use(`${baseUrl}/qa`, qaRouter.getRouter());

// Kanban routes
const kanbanRouter = new KanbanRouter();
app.use(`${baseUrl}/kanban`, kanbanRouter.getRouter());

// Listings routes
const listingsRouter = new ListingRouter();
app.use(`${baseUrl}/listings`, listingsRouter.getRouter());

// Services routes
const servicesRouter = new ServiceRouter();
app.use(`${baseUrl}/services`, servicesRouter.getRouter());

// Chat routes
const chatRouter = new ChatRouter();
app.use(`${baseUrl}/chat`, chatRouter.getRouter());

// Expense Tracker routes
const expenseTrackerRouter = new ExpenseTrackerRouter();
app.use(`${baseUrl}/expense-tracker`, expenseTrackerRouter.getRouter());

// Contact Form routes
const contactRouter = new ContactRouter();
app.use(`${baseUrl}/contact`, contactRouter.getRouter());

// Jobs routes
const jobRouter = new JobRouter();
app.use(`${baseUrl}/jobs`, jobRouter.getRouter());

// 404 error handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        status: "fail",
        statusCode: 404,
        message: "Resource not found"
    });
});

// Error handling middleware
app.use(ErrorMiddleware.handleError);

// start the server
app.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});