import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';
import {
  OrganizationBaseService,
  OrganizationQueryService,
  OrganizationCommandService,
} from './services';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    SupabaseService,
    RequestContextService,
    OrganizationBaseService,
    OrganizationQueryService,
    OrganizationCommandService,
  ],
  exports: [OrganizationService]
})
export class OrganizationModule {}
