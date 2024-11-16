import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheOptions {
  ttl: number;
  tags?: string[];
}

interface CacheItem {
  data: any;
  timestamp: number;
  tags: string[];
  ttl: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, CacheItem> = new Map();
  private readonly defaultTTL: number;

  constructor(private configService: ConfigService) {
    this.defaultTTL = this.configService.get('cache.ttl') || 5 * 60 * 1000; // 5 minutes default
    
    // Periodic cleanup of expired items
    setInterval(() => {
      this.cleanup();
    }, 60000); // Run cleanup every minute
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.logger.debug(`Cache expired for key: ${key}`);
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return item.data as T;
  }

  async set(key: string, data: any, options?: Partial<CacheOptions>): Promise<void> {
    const ttl = options?.ttl || this.defaultTTL;
    const tags = options?.tags || [];

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      tags,
      ttl
    });

    this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl}ms`);
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Cache invalidated for key: ${key}`);
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (tags.some(tag => value.tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.logger.debug(`Cache invalidated for tags: ${tags.join(', ')}`);
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Complete cache invalidation');
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  // Helper method to get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
