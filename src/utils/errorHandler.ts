type CustomError = Error & {
    statusCode: number;
    message: string | string[];
};

export const errorHandler = (statusCode: number, message: string | string[]) => {
    const errorMessage = Array.isArray(message) ? message : [message];
    const error = new Error(errorMessage.join(', ')) as CustomError;
    error.statusCode = statusCode;
    error.message = errorMessage.join(', ');
    return error;
};