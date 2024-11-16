import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class OrganizationBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
  ) {}

  protected async invalidateOrganizationCache(organizationId: string, slug?: string) {
    const tags = [
      'organizations',
      `organization:${organizationId}`,
    ];
    
    if (slug) {
      tags.push(`organization:slug:${slug}`);
    }

    await this.cacheService.invalidateByTags(tags);
  }
}
