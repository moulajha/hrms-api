import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConfigService } from '@nestjs/config';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export async function setupTelemetry() {
  const configService = new ConfigService();
  
  if (!configService.get('monitoring.enabled')) {
    return;
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: configService.get('app.name'),
      [SemanticResourceAttributes.SERVICE_VERSION]: configService.get('app.version'),
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: configService.get('app.nodeEnv'),
    }),
    traceExporter: new OTLPTraceExporter({
      url: configService.get('monitoring.tracingEndpoint'),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  await sdk.start();

  // Gracefully shut down SDK when process is terminated
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
