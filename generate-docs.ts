import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Senior Backend API',
        description: 'API documentation for the Senior Backend project',
        version: '1.0.0',
        contact: {
            name: 'Khaled Saeed'
        }
    },
    host: 'localhost:5005',
    basePath: '/',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'authorization',
            in: 'header',
            description: 'Enter your bearer token in the format "Bearer {token}"'
        }
    },
    servers: [
        {
            url: '{baseUrl}/v1',
            description: 'API server',
            variables: {
                baseUrl: {
                    default: 'http://localhost:5005',
                    description: 'Base URL of the API'
                }
            }
        }
    ],
    definitions: {
        SuccessResponse: {
            status: "success",
            statusCode: 200,
            message: "Operation completed successfully",
            data: {}
        },
        ErrorResponse: {
            status: "error",
            statusCode: 400,
            message: "An error occurred",
            error: {}
        }
    }
};

const outputFile = './api-docs/openapi-file.yml';

const routes = [
    './src/api/**/*.routes.ts',
    './src/api/**/*.controller.ts',
    './src/api/**/*.service.ts',
    './src/api/**/*.validation.ts',
    './src/api/**/*.rateLimiting.ts'
];


swaggerAutogen(outputFile, routes, doc);