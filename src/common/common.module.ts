import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './services/supabase.service';
import { RequestContextService } from './services/request-context.service';
import { LoggerService } from './services/logger.service';
import { CacheService } from './services/cache.service';
import { MetricsController } from './controllers/metrics.controller';
import { CorrelationMiddleware } from './middleware/correlation.middleware';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [
    SupabaseService,
    RequestContextService,
    LoggerService,
    CacheService
  ],
  exports: [
    SupabaseService,
    RequestContextService,
    LoggerService,
    CacheService
  ]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*');
  }
}
