import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    const requestId = uuidv4();

    // Set correlation ID in response header
    res.setHeader('x-correlation-id', correlationId);

    // Create context store
    const store = new Map<string, any>();
    store.set('correlationId', correlationId);
    store.set('requestId', requestId);
    store.set('startTime', Date.now());
    
    // Extract tenant ID from header if present
    const tenantId = req.headers['x-tenant-id'] as string;
    if (tenantId) {
      store.set('tenantId', tenantId);
    }

    // Run with context
    this.contextService.run(store, () => next());
  }
}
