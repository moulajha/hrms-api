import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class EmployeeBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {}

  protected async validateUserContext() {
    const userContext = this.contextService.getUserContext();
    if (!userContext) {
      throw new BadRequestException('User context not found');
    }
    return userContext;
  }

  protected async invalidateEmployeeCache(employeeId: string, organizationId: string) {
    await this.cacheService.invalidateByTags([
      `org:${organizationId}`,
      'employees',
      `employee:${employeeId}`
    ]);
  }

  protected maskSensitiveData(data: any) {
    return {
      ...data,
      officialEmail: '***@***.***',
    };
  }
}
