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
    ]
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