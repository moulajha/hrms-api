import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const store = new Map<string, any>();
    
    // Initialize the store with empty values
    store.set('userContext', null);
    store.set('tenantId', null);
    store.set('correlationId', req.headers['x-correlation-id'] || null);
    store.set('requestId', req.headers['x-request-id'] || null);
    store.set('traceContext', null);

    // Run the request in the context of our store
    this.contextService.run(store, () => {
      next();
    });
  }
}
