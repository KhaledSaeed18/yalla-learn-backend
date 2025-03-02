import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors";

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const version = process.env.API_VERSION!;
const baseUrl = `${process.env.BASE_URL!}/${version}`;

console.log(baseUrl);

app.get(`${baseUrl}/`, (req: Request, res: Response) => {
    res.send('Hello, World!');
});

app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Route not found",
    });
});
