import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly contextService: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logResponse(method, path, startTime, data);
        },
        error: (error) => {
          this.logError(method, path, startTime, error);
        },
      }),
    );
  }

  private logResponse(method: string, path: string, startTime: number, data: any) {
    const duration = Date.now() - startTime;
    const context = this.getLoggingContext(method, path, 200, duration);
    
    this.logger.log('Request completed', 'LoggingInterceptor', { 
      ...context,
      responseSize: JSON.stringify(data).length 
    });
  }

  private logError(method: string, path: string, startTime: number, error: any) {
    const duration = Date.now() - startTime;
    const context = this.getLoggingContext(method, path, error.status || 500, duration);

    this.logger.error('Request failed', error.stack, 'LoggingInterceptor');
  }

  private getLoggingContext(method: string, path: string, statusCode: number, duration: number) {
    return {
      correlationId: this.contextService.getCorrelationId(),
      requestId: this.contextService.getRequestId(),
      method,
      path,
      statusCode,
      duration,
      userContext: this.contextService.getUserContext(),
      tenantId: this.contextService.getTenantId()
    };
  }
}
