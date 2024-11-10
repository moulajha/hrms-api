export interface AppConfig {
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
