import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../services/request-context.service';

// Extend the Express Request type to include user
interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    const requestId = uuidv4();

    // Set correlation ID in response header
    res.setHeader('x-correlation-id', correlationId);

    // Create context store with initial values
    const store = new Map<string, any>();
    store.set('correlationId', correlationId);
    store.set('requestId', requestId);
    store.set('startTime', Date.now());
    
    // Extract tenant ID from header if present
    const tenantId = req.headers['x-tenant-id'] as string;
    if (tenantId) {
      store.set('tenantId', tenantId);
    }

    // Preserve any existing user context from the request
    if (req.user) {
      store.set('userContext', req.user);
    }

    // Create a wrapper for next() that ensures the context is maintained
    const nextWithContext = () => {
      try {
        next();
      } catch (error) {
        // Ensure context is cleaned up even if an error occurs
        throw error;
      }
    };

    // Run with context
    this.contextService.run(store, nextWithContext);
  }
}
