const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.1',
    info: {
      title: 'API Documentation of A2N',
      version: '1.0.0',
      description: 'API documentation for the TimeSheet application',
    },
    components: {
      securitySchemes: {
       JWT: {
        type: 'http',
         scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Send JWT in the Authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
      },
    },
    security: [
      {
        JWT: [],
      },
    ],
  },
  apis: ['src/**/*.ts'],
};

export default swaggerOptions;
