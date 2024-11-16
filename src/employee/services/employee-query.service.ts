import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EmployeeBaseService } from './employee-base.service';
import { QueryEmployeeDto } from '../dto/query-employee.dto';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { RequestContextService } from '../../common/services/request-context.service';

@Injectable()
export class EmployeeQueryService extends EmployeeBaseService {
  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {
    super(supabaseService, contextService, cacheService);
  }

  async findAll(query: QueryEmployeeDto) {
    try {
      const userContext = await this.validateUserContext();

      // Cache key based on query parameters
      const cacheKey = `employees:${userContext.tenantId}:${query.page}:${query.limit}:${query.search || ''}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error, count } = await this.supabaseService.getEmployees(
        userContext.tenantId,
        query.page,
        query.limit,
        query.search
      );

      if (error) {
        this.logger.error('Error fetching employees:', error);
        throw new InternalServerErrorException('Failed to fetch employees');
      }

      const result = {
        items: data,
        meta: {
          total: count,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(count / query.limit)
        }
      };

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, result, {
        ttl: 5 * 60 * 1000,
        tags: [`org:${userContext.tenantId}`, 'employees']
      });

      return result;
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const userContext = await this.validateUserContext();

      // Cache key for individual employee
      const cacheKey = `employee:${id}:${userContext.tenantId}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService.getEmployeeById(id, userContext.tenantId);

      if (error) {
        this.logger.error('Error fetching employee:', error);
        throw new InternalServerErrorException('Failed to fetch employee');
      }

      if (!data) {
        throw new NotFoundException('Employee not found');
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: [`org:${userContext.tenantId}`, 'employee', `employee:${id}`]
      });

      return data;
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async verifyEmployeeExists(id: string, organizationId: string) {
    const { data, error } = await this.supabaseService.getEmployeeById(id, organizationId);

    if (error) {
      this.logger.error('Error fetching employee:', error);
      throw new InternalServerErrorException('Failed to fetch employee');
    }

    if (!data) {
      throw new NotFoundException('Employee not found');
    }

    return data;
  }
}
