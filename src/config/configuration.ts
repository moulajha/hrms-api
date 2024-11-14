import { registerAs } from '@nestjs/config';
import config from '../config';

// Ensure type safety for the configuration
interface AppConfig {
  nodeEnv: string;
  name: string;
  version: string;
  port: number;
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    filename: string;
  };
  monitoring: {
    enabled: boolean;
    tracingEndpoint: string;
    metricsEndpoint: string;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  security: {
    corsEnabled: boolean;
    corsOrigin: string[];
    rateLimitEnabled: boolean;
    rateLimitMax: number;
  };
}

export default registerAs('app', (): AppConfig => ({
  nodeEnv: config.nodeEnv || 'production',
  name: config.name || 'hrms-api',
  version: config.version || '1.0.0',
  port: config.port || 3000,
  supabase: {
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    serviceKey: config.supabase.serviceKey,
  },
  logging: {
    level: config.logging.level || 'info',
    enableConsole: config.logging.enableConsole,
    enableFile: config.logging.enableFile,
    filename: config.logging.filename,
  },
  monitoring: {
    enabled: config.monitoring.enabled,
    tracingEndpoint: config.monitoring.tracingEndpoint,
    metricsEndpoint: config.monitoring.metricsEndpoint,
  },
  api: {
    timeout: config.api.timeout,
    retryAttempts: config.api.retryAttempts,
    retryDelay: config.api.retryDelay,
  },
  security: {
    corsEnabled: config.security.corsEnabled,
    corsOrigin: config.security.corsOrigin,
    rateLimitEnabled: config.security.rateLimitEnabled,
    rateLimitMax: config.security.rateLimitMax,
  },
}));
