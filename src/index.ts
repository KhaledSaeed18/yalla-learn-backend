import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import { ErrorMiddleware } from './middlewares/error.middleware';

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

app.use(express.json());

const port = process.env.PORT;
const version = process.env.API_VERSION!;
const baseUrl = `${process.env.BASE_URL!}/${version}`;

app.get(`${baseUrl}/`, (req: Request, res: Response) => {
    res.send('Hello, World!');
});

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
