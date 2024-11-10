import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from './request-context.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: WinstonLogger;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextService: RequestContextService,
  ) {
    const logConfig = this.configService.get('logging') || {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      filename: 'app.log'
    };
    
    const loggerTransports = [];
    
    if (logConfig.enableConsole !== false) {
      loggerTransports.push(new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
          }),
        ),
      }));
    }

    if (logConfig.enableFile) {
      loggerTransports.push(new transports.File({
        filename: logConfig.filename || 'app.log',
        format: format.combine(
          format.timestamp(),
          format.json(),
        ),
      }));
    }

    this.logger = createLogger({
      level: logConfig.level || 'info',
      transports: loggerTransports,
    });
  }

  private getLogContext() {
    return {
      correlationId: this.contextService.getCorrelationId(),
      requestId: this.contextService.getRequestId(),
      userContext: this.contextService.getUserContext(),
      tenantId: this.contextService.getTenantId(),
    };
  }

  log(message: string, context?: string, ...args: any[]) {
    this.logger.info(message, {
      context,
      ...this.getLogContext(),
      ...args,
    });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      trace,
      context,
      ...this.getLogContext(),
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, {
      context,
      ...this.getLogContext(),
    });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, {
      context,
      ...this.getLogContext(),
    });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, {
      context,
      ...this.getLogContext(),
    });
  }
}
