import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, SupabaseService, RequestContextService],
  exports: [OrganizationService]
})
export class OrganizationModule {}
