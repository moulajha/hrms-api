import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EmployeeTypeBaseService } from './employee-type-base.service';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { RequestContextService } from '../../common/services/request-context.service';

@Injectable()
export class EmployeeTypeQueryService extends EmployeeTypeBaseService {
  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {
    super(supabaseService, contextService, cacheService);
  }

  async findAll(organizationId: string) {
    try {
      // Cache key for employee types list
      const cacheKey = `employee_types:${organizationId}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService.getAdminClient()
        .from('employee_types')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error('Error fetching employee types:', error);
        throw new InternalServerErrorException('Failed to fetch employee types');
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: [`org:${organizationId}`, 'employee_types']
      });

      return data;
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, organizationId: string) {
    try {
      // Cache key for individual employee type
      const cacheKey = `employee_type:${id}:${organizationId}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService.getAdminClient()
        .from('employee_types')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        this.logger.error('Error fetching employee type:', error);
        throw new InternalServerErrorException('Failed to fetch employee type');
      }

      if (!data) {
        throw new NotFoundException('Employee type not found');
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: [`org:${organizationId}`, 'employee_types', `employee_type:${id}`]
      });

      return data;
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async verifyEmployeeType(id: string, organizationId: string) {
    try {
      const { data, error } = await this.supabaseService.getAdminClient()
        .from('employee_types')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        this.logger.error('Error verifying employee type:', error);
        throw new InternalServerErrorException('Failed to verify employee type');
      }

      if (!data) {
        throw new NotFoundException('Employee type not found');
      }

      return data;
    } catch (error) {
      this.logger.error('Error in verifyEmployeeType:', error);
      throw error;
    }
  }
}
