import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 * @throws Error if token is invalid or verification fails
 */
export const verifyJWT = (token: string): JwtPayload & { userId: string; role?: string } => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & {
            userId: string;
            role?: string;
        };

        if (!decoded || !decoded.userId) {
            throw new Error('Invalid token payload');
        }

        return decoded;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
        throw new Error('Token verification failed');
    }
};