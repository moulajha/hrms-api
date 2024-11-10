import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { setupTelemetry } from './config/telemetry.config';
import { LoggerService } from './common/services/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { RequestContextService } from './common/services/request-context.service';

async function bootstrap() {
  // Setup OpenTelemetry
  await setupTelemetry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const contextService = app.get(RequestContextService);
  
  app.useLogger(logger);

  // Global configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          connectSrc: [`'self'`, 'http://localhost:3000', 'http://[::1]:3000'],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`, `'unsafe-eval'`],
          fontSrc: [`'self'`, 'https:', 'data:'],
          objectSrc: [`'none'`],
          mediaSrc: [`'self'`],
          frameSrc: [`'self'`],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  
  // CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://[::1]:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-tenant-id'],
    exposedHeaders: ['x-correlation-id'],
    credentials: true,
  });
  
  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter(logger, contextService));
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger, contextService),
    new TransformInterceptor(contextService),
    new TimeoutInterceptor(configService),
  );

  // Setup Swagger documentation
  if (configService.get('app.nodeEnv') !== 'production') {
    setupSwagger(app);
  }

  // Start server
  const port = configService.get('app.port');
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces
  
  logger.log(
    `Application is running on: ${await app.getUrl()}`,
    'Bootstrap',
    {
      version: configService.get('app.version'),
      nodeEnv: configService.get('app.nodeEnv'),
      swagger: configService.get('app.nodeEnv') !== 'production' ? `${await app.getUrl()}/api/docs` : 'disabled'
    }
  );
}

bootstrap();
