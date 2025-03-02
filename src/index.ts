import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { ErrorMiddleware } from './middlewares/error.middleware';
import AuthRouter from './api/auth/auth.routes';
import { securityHeaders } from './middlewares/securityHeaders.middleware';

dotenv.config();

const app: Express = express();

const allowedOrigins = [
    "http://localhost:3000",
];

app.use(
    cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(securityHeaders);

app.use(express.json());

const port = process.env.PORT;
const version = process.env.API_VERSION!;
const baseUrl = `${process.env.BASE_URL!}/${version}`;

const authRouter = new AuthRouter();
app.use(`${baseUrl}/auth`, authRouter.getRouter());

app.get("*", (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
});

app.use(ErrorMiddleware.handleError);

app.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
