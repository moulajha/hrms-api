import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable({ scope: Scope.DEFAULT })
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<Map<string, any>>();

  getStore(): Map<string, any> {
    return this.storage.getStore() || new Map();
  }

  get<T>(key: string): T {
    return this.getStore().get(key);
  }

  set(key: string, value: any): void {
    this.getStore().set(key, value);
  }

  run(context: Map<string, any>, next: () => void): void {
    this.storage.run(context, next);
  }

  getCorrelationId(): string {
    return this.get('correlationId');
  }

  getRequestId(): string {
    return this.get('requestId');
  }

  getTraceContext(): any {
    return this.get('traceContext');
  }

  getUserContext(): any {
    return this.get('userContext');
  }

  getTenantId(): string {
    return this.get('tenantId');
  }

  setUserContext(userContext: any): void {
    this.set('userContext', userContext);
  }

  setTenantId(tenantId: string): void {
    this.set('tenantId', tenantId);
  }
}
