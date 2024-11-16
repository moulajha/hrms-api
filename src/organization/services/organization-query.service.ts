import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { OrganizationBaseService } from './organization-base.service';
import { QueryOrganizationDto } from '../dto/query-organization.dto';

@Injectable()
export class OrganizationQueryService extends OrganizationBaseService {
  async findAll(query: QueryOrganizationDto) {
    try {
      // Cache key based on query parameters
      const cacheKey = `organizations:${query.page}:${query.limit}:${query.search || ''}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error, count } = await this.supabaseService.getOrganizations(
        query.page,
        query.limit,
        query.search
      );

      if (error) {
        this.logger.error('Error fetching organizations:', error);
        throw new InternalServerErrorException('Failed to fetch organizations');
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
        tags: ['organizations']
      });

      return result;
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      // Cache key for individual organization
      const cacheKey = `organization:${id}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService.getOrganizationById(id);

      if (error) {
        this.logger.error('Error fetching organization:', error);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!data) {
        throw new NotFoundException('Organization not found');
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: ['organizations', `organization:${id}`]
      });

      return data;
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      // Cache key for organization by slug
      const cacheKey = `organization:slug:${slug}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService.getOrganizationBySlug(slug);

      if (error) {
        this.logger.error('Error fetching organization:', error);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!data) {
        throw new NotFoundException('Organization not found');
      }

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: ['organizations', `organization:${data.id}`]
      });

      return data;
    } catch (error) {
      this.logger.error('Error in findBySlug:', error);
      throw error;
    }
  }
}
