import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { RequestContextService } from '../services/request-context.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly contextService: RequestContextService,
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException
        ? exception.getResponse()
        : exception.message;

    const errorResponse = {
      error: {
        statusCode: status,
        message: message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      meta: {
        correlationId: this.contextService.getCorrelationId(),
        requestId: this.contextService.getRequestId(),
      },
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception.stack,
      'HttpExceptionFilter'
    );

    response
      .status(status)
      .json(errorResponse);
  }
}
