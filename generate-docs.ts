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
                    default: 'http://localhost:3000',
                    description: 'Base URL of the API'
                }
            }
        }
    ]
};

const outputFile = './api-docs/openapi-file.yml';
const routes = [
    './src/api/auth/auth.routes.ts',
    './src/api/blog/blog.routes.ts',
    './src/api/qa/qa.routes.ts',
    './src/api/kanban/kanban.routes.ts',
    './src/api/ai/ai.routes.ts',
    './src/api/interviews/interviews.routes.ts',
    './src/api/listings/listings.routes.ts',
    './src/api/services/services.routes.ts',
    './src/api/reports/reports.routes.ts'
];

swaggerAutogen(outputFile, routes, doc);