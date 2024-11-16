import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EmployeeTypeBaseService } from './employee-type-base.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { RequestContextService } from '../../common/services/request-context.service';

@Injectable()
export class EmployeeTypeCommandService extends EmployeeTypeBaseService {
  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {
    super(supabaseService, contextService, cacheService);
  }

  async generateTypeId(organizationId: string) {
    try {
      // Get organization details
      const { data: org, error: orgError } = await this.supabaseService.getAdminClient()
        .from('organizations')
        .select('name, slug')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        this.logger.error('Error fetching organization:', orgError);
        throw new InternalServerErrorException('Failed to fetch organization details');
      }

      // Get current count of employee types for this organization
      const { count, error: countError } = await this.supabaseService.getAdminClient()
        .from('employee_types')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        this.logger.error('Error counting employee types:', countError);
        throw new InternalServerErrorException('Failed to count employee types');
      }

      // Generate sequence number
      const nextSequence = (count || 0) + 1;
      
      // Generate type ID using organization name and sequence
      // Format: ORG_NAME_ET_001 (ET for Employee Type)
      const typeId = `${org.slug.toUpperCase()}_ET_${String(nextSequence).padStart(3, '0')}`;

      return typeId;
    } catch (error) {
      this.logger.error('Error generating employee type ID:', error);
      throw error;
    }
  }

  async create(organizationId: string, name: string) {
    try {
      // Generate type ID
      const typeId = await this.generateTypeId(organizationId);

      // Create employee type
      const { data, error } = await this.supabaseService.getAdminClient()
        .from('employee_types')
        .insert({
          id: typeId,
          name,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating employee type:', error);
        throw new InternalServerErrorException('Failed to create employee type');
      }

      // Invalidate cache
      await this.invalidateEmployeeTypeCache(typeId, organizationId);

      return data;
    } catch (error) {
      this.logger.error('Error in create employee type:', error);
      throw error;
    }
  }
}
