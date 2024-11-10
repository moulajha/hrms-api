import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: this.configService.get('app.version'),
      environment: this.configService.get('app.nodeEnv'),
    };
  }

  getInfo(): any {
    return {
      name: this.configService.get('app.name'),
      version: this.configService.get('app.version'),
      environment: this.configService.get('app.nodeEnv'),
      monitoring: {
        enabled: this.configService.get('app.monitoring.enabled'),
      },
      logging: {
        level: this.configService.get('app.logging.level'),
        console: this.configService.get('app.logging.enableConsole'),
        file: this.configService.get('app.logging.enableFile'),
      },
      api: {
        timeout: this.configService.get('app.api.timeout'),
      }
    };
  }
}
