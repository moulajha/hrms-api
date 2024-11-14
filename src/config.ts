interface Config {
  nodeEnv: string;
  name: string;
  version: string;
  port: number;
  database: {
    url: string;
    directUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
    jwtSecret: string;
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

const config: Config = {
  nodeEnv: 'production',
  name: 'hrms-api',
  version: '1.0.0',
  port: 3000,
  database: {
    url: "postgresql://postgres.lrbayefertebmfgrzcuo:N%2Av%23MvVHkjSu74d@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    directUrl: "postgresql://postgres.lrbayefertebmfgrzcuo:N%2Av%23MvVHkjSu74d@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  },
  supabase: {
    url: "https://lrbayefertebmfgrzcuo.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmF5ZWZlcnRlYm1mZ3J6Y3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjQyMzMsImV4cCI6MjA0NjQwMDIzM30.f3A6xN24P5j3Zp3bhSe4_o__fSpNrLu7OVfgyejFHVE",
    serviceKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYmF5ZWZlcnRlYm1mZ3J6Y3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDgyNDIzMywiZXhwIjoyMDQ2NDAwMjMzfQ.gicohn_oVSwtoTH4kyaT_yIzLhRCMgs_b66F-Os3eC4",
    jwtSecret: "dqVNDWQ50YIIoh+gB8NTURV414z8k4QCOkzsZ3PLNdedPJ8vN8WVkZROqG0jG52AGjbh9cz9DKfig4VyFdPrvQ=="
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false,
    filename: 'app.log',
  },
  monitoring: {
    enabled: true,
    tracingEndpoint: 'http://localhost:4318/v1/traces',
    metricsEndpoint: 'http://localhost:4318/v1/metrics',
  },
  api: {
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  security: {
    corsEnabled: true,
    corsOrigin: ['http://localhost:3000'],
    rateLimitEnabled: true,
    rateLimitMax: 100,
  },
};

export default config;
