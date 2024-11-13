import { Global, Module } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { RequestContextService } from './services/request-context.service';
import { SupabaseService } from './services/supabase.service';

@Global()
@Module({
  providers: [LoggerService, RequestContextService, SupabaseService],
  exports: [LoggerService, RequestContextService, SupabaseService],
})
export class CommonModule {}
