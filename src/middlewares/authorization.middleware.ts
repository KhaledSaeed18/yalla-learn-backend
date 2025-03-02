import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { errorHandler } from '../utils/errorHandler';

declare module 'express' {
    interface Request {
        user?: JwtPayload;
    }
}

export const authorize = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(errorHandler(403, 'Access denied: invalid token format'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return next(errorHandler(401, 'Unauthorized: Token has expired'));
        }
        next(errorHandler(401, 'Unauthorized: Invalid token'));
    }
};