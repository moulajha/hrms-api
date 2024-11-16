import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { RequestContextService } from '../../common/services/request-context.service';

@Injectable()
export class EmployeeTypeBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {}

  protected async invalidateEmployeeTypeCache(typeId: string, organizationId: string) {
    await this.cacheService.invalidateByTags([
      `org:${organizationId}`,
      'employee_types',
      `employee_type:${typeId}`
    ]);
  }

  protected async validateUserContext() {
    const userContext = this.contextService.getUserContext();
    if (!userContext) {
      throw new Error('User context not found');
    }
    return userContext;
  }

  protected maskSensitiveData(data: any) {
    return {
      ...data,
      name: data.name,
    };
  }
}
