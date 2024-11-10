import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('HRMS API')
    .setDescription(`
      Human Resource Management System API Documentation
      
      ## Authentication
      This API uses Bearer token authentication. After signing in, include the token in the Authorization header:
      \`\`\`
      Authorization: Bearer your-token-here
      \`\`\`
      
      ## Getting Started
      1. Create an account using POST /auth/signup
      2. Sign in using POST /auth/signin
      3. Use the returned token in the Authorization header for subsequent requests
      
      ## Error Responses
      The API uses standard HTTP status codes:
      - 200: Success
      - 400: Bad Request
      - 401: Unauthorized
      - 403: Forbidden
      - 404: Not Found
      - 500: Internal Server Error
      
      Error responses include:
      \`\`\`json
      {
        "statusCode": 400,
        "message": "Error message here",
        "error": "Error type"
      }
      \`\`\`
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'Authentication and authorization endpoints')
    .addTag('Health', 'Health check endpoints')
    .addTag('Info', 'Application information endpoints')
    .addServer('http://localhost:3000', 'Local environment')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add custom examples
  document.components.examples = {
    SignUpRequest: {
      value: {
        email: "user@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe"
      }
    },
    SignInRequest: {
      value: {
        email: "user@example.com",
        password: "Password123!"
      }
    },
    AuthResponse: {
      value: {
        user: {
          id: "user-uuid",
          email: "user@example.com",
          roles: ["EMPLOYEE"],
          permissions: ["READ_PROFILE"]
        },
        session: {
          access_token: "eyJhbGciOiJIUzI1...",
          token_type: "bearer",
          expires_in: 3600
        }
      }
    },
    ResetPasswordRequest: {
      value: {
        email: "user@example.com"
      }
    },
    UpdatePasswordRequest: {
      value: {
        newPassword: "NewPassword123!"
      }
    },
    UserProfile: {
      value: {
        id: "user-uuid",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        roles: ["EMPLOYEE"],
        permissions: ["READ_PROFILE"],
        tenantId: "tenant-uuid"
      }
    }
  };

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
      displayRequestDuration: true
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HRMS API Documentation'
  });
}
