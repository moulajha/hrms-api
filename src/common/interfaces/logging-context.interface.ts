export interface LoggingContext {
  correlationId: string;
  requestId: string;
  traceId: string;
  spanId: string;
  userId?: string;
  tenantId?: string;
  path: string;
  method: string;
  statusCode?: number;
  duration?: number;
}
