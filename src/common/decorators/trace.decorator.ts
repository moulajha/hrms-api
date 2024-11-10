import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { RequestContextService } from '../services/request-context.service';

interface TraceOptions {
  name?: string;
  attributes?: Record<string, string | number | boolean>;
}

export function Trace(options: TraceOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('hrms-api');
      const spanName = options.name || `${className}.${methodName}`;
      
      const span = tracer.startSpan(spanName, {
        attributes: {
          className,
          methodName,
          ...options.attributes,
        },
      });

      // Get the request context service instance
      const contextService: RequestContextService = (global as any).requestContextService;
      
      try {
        // Add trace context to the current context
        if (contextService) {
          const correlationId = contextService.getCorrelationId();
          const requestId = contextService.getRequestId();
          
          span.setAttributes({
            correlationId,
            requestId,
          });
        }

        // Execute the method within the trace context
        const result = await context.with(
          trace.setSpan(context.active(), span),
          () => originalMethod.apply(this, args),
        );

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}

// Helper function to get the current span
export function getCurrentSpan(): Span | undefined {
  return trace.getSpan(context.active());
}

// Helper function to add attributes to the current span
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>,
): void {
  const currentSpan = getCurrentSpan();
  if (currentSpan) {
    currentSpan.setAttributes(attributes);
  }
}

// Helper function to add events to the current span
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): void {
  const currentSpan = getCurrentSpan();
  if (currentSpan) {
    currentSpan.addEvent(name, attributes);
  }
}

// Helper function to set error status on the current span
export function setSpanError(error: Error): void {
  const currentSpan = getCurrentSpan();
  if (currentSpan) {
    currentSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    currentSpan.recordException(error);
  }
}
