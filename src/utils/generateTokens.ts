import jwt from 'jsonwebtoken';

interface Payload {
    userId: string;
}

export const generateAccessToken = (userId: string): string => {
    const payload: Payload = { userId };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '20m',
    });

    return accessToken;
};

export const generateRefreshToken = (userId: string): string => {
    const payload: Payload = { userId };
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: '7d',
    });

    return refreshToken;
};
