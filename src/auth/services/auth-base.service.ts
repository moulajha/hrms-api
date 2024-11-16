import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { AuthError } from '@supabase/supabase-js';

@Injectable()
export class AuthBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly cacheService: CacheService,
  ) {}

  protected handleAuthError(error: any) {
    this.logger.error('Auth error:', error);
    
    if (error instanceof UnauthorizedException) {
      throw error;
    }

    if (error?.message?.includes('JSON object requested')) {
      throw new UnauthorizedException('Invalid credentials or user not found');
    }

    throw new InternalServerErrorException('Authentication failed');
  }

  protected async invalidateUserCache(userId: string) {
    await this.cacheService.invalidateByTags([
      `user:${userId}`,
      'users'
    ]);
  }

  protected async cacheUserSession(userId: string, sessionData: any) {
    const cacheKey = `user:session:${userId}`;
    await this.cacheService.set(cacheKey, sessionData, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      tags: [`user:${userId}`, 'sessions']
    });
  }

  protected async getUserFromCache(userId: string) {
    const cacheKey = `user:${userId}`;
    return this.cacheService.get(cacheKey);
  }
}
