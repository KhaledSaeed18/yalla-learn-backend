import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { ErrorMiddleware } from './middlewares/error.middleware';
import { securityHeaders } from './middlewares/securityHeaders.middleware';
import http from 'http';
import { connectMongoDB } from './config/mongodb';

import AuthRouter from './api/auth/auth.routes';
import BlogRouter from './api/blog/blog.routes';
import QARouter from './api/qa/qa.routes';
import KanbanRouter from './api/kanban/kanban.routes';
import AIRouter from './api/ai/ai.routes';
import ListingRouter from './api/listings/listings.routes';
import ChatRouter from './api/chat/chat.routes';
import { SocketService } from './socket/chat/socket.service';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:3000",
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

// QA routes
const qaRouter = new QARouter();
app.use(`${baseUrl}/qa`, qaRouter.getRouter());

// Kanban routes
const kanbanRouter = new KanbanRouter();
app.use(`${baseUrl}/kanban`, kanbanRouter.getRouter());

// AI routes
const aiRouter = new AIRouter();
app.use(`${baseUrl}/ai`, aiRouter.getRouter());

// Listings routes
const listingsRouter = new ListingRouter();
app.use(`${baseUrl}/listings`, listingsRouter.getRouter());

// Chat routes
const chatRouter = new ChatRouter();
app.use(`${baseUrl}/chat`, chatRouter.getRouter());

// Initialize Socket.io server
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const socketService = new SocketService(server);

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

// Connect to MongoDB first, then start the server
connectMongoDB().then(() => {
    server.listen(port, () => {
        console.log(`Server is running on: http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
});
