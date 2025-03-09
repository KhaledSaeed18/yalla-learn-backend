import crypto from 'crypto';

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
    const randomBytes = crypto.randomBytes(3);
    const randomNumber = parseInt(randomBytes.toString('hex'), 16);
    const sixDigits = randomNumber % 1000000;
    return sixDigits.toString().padStart(6, '0');
};

