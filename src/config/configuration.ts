import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'hrms-api',
  version: process.env.APP_VERSION || '1.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filename: process.env.LOG_FILENAME || 'app.log',
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    tracingEndpoint: process.env.TRACING_ENDPOINT || 'http://localhost:4318/v1/traces',
    metricsEndpoint: process.env.METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
  },
  api: {
    timeout: parseInt(process.env.API_TIMEOUT, 10) || 5000,
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.API_RETRY_DELAY, 10) || 1000,
  },
  security: {
    corsEnabled: process.env.CORS_ENABLED === 'true',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
}));
