import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContextService } from '../services/request-context.service';

interface ErrorResponse {
  message?: string;
  error?: string;
  details?: any;
  statusCode?: number;
  [key: string]: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly contextService: RequestContextService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get detailed error information
    let errorResponse: ErrorResponse = exception instanceof HttpException
      ? exception.getResponse() as ErrorResponse
      : { message: exception.message || 'Internal server error' };

    // Ensure errorResponse is an object
    if (typeof errorResponse === 'string') {
      errorResponse = { message: errorResponse };
    }

    // Get stack trace for non-HTTP exceptions in development
    const stack = process.env.NODE_ENV !== 'production' && !(exception instanceof HttpException)
      ? exception.stack
      : undefined;

    // Get request context information
    const correlationId = this.contextService.getCorrelationId();
    const userContext = this.contextService.getUserContext();

    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      {
        error: errorResponse,
        stack,
        correlationId,
        userId: userContext?.id,
        organizationId: userContext?.tenantId,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      exception.stack,
    );

    // Structure the error response
    const error = {
      statusCode: status,
      message: errorResponse.message || exception.message || 'Internal server error',
      ...(errorResponse.error && { error: errorResponse.error }),
      ...(errorResponse.details && { details: errorResponse.details }),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
      error['stack'] = stack;
    }

    // Send the response
    response
      .status(status)
      .json({
        error,
        meta: {
          correlationId,
        },
      });
  }
}
