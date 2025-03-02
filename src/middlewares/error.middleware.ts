/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";

class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class ErrorMiddleware {
  static handleError(err: CustomError, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
      status: "fail",
      statusCode,
      message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

export { CustomError, ErrorMiddleware };
