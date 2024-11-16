import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContextService } from '../services/request-context.service';

export interface Response<T> {
  data: T;
  meta?: {
    timestamp: string;
    correlationId?: string;
    requestId?: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly contextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(response => {
        // If response is null/undefined, return a properly structured response
        if (response === undefined || response === null) {
          return {
            data: null,
            meta: {
              timestamp: new Date().toISOString(),
              correlationId: this.contextService.getCorrelationId(),
              requestId: this.contextService.getRequestId(),
            }
          };
        }

        // If response already has data/meta structure, just add missing meta fields
        if (response.data !== undefined) {
          return {
            ...response,
            meta: {
              ...response.meta,
              timestamp: new Date().toISOString(),
              correlationId: this.contextService.getCorrelationId() || response.meta?.correlationId,
              requestId: this.contextService.getRequestId() || response.meta?.requestId,
            }
          };
        }

        // For regular responses, wrap them in our format
        return {
          data: response,
          meta: {
            timestamp: new Date().toISOString(),
            correlationId: this.contextService.getCorrelationId(),
            requestId: this.contextService.getRequestId(),
          }
        };
      }),
    );
  }
}
