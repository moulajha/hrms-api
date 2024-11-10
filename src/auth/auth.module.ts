import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, RequestContextService],
  exports: [AuthService, SupabaseService],
})
export class AuthModule {}
