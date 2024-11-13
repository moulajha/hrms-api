import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { RequestContextService } from '../common/services/request-context.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly contextService: RequestContextService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    try {
      // Check if organization with same slug exists
      const { data: existingOrg, error: slugError } = await this.supabaseService.getOrganizationBySlug(
        createOrganizationDto.slug
      );

      if (slugError) {
        this.logger.error('Error checking existing organization:', slugError);
        throw new InternalServerErrorException('Error checking existing organization');
      }

      if (existingOrg) {
        throw new ConflictException('Organization with this slug already exists');
      }

      // Create organization
      const { data: organization, error: createError } = await this.supabaseService.createOrganization({
        name: createOrganizationDto.name,
        slug: createOrganizationDto.slug,
        email: createOrganizationDto.email,
        phone: createOrganizationDto.phone,
        address: createOrganizationDto.address,
        gstin: createOrganizationDto.gstin,
        pan: createOrganizationDto.pan,
      });

      if (createError) {
        this.logger.error('Error creating organization:', createError);
        throw new InternalServerErrorException('Failed to create organization');
      }

      return {
        message: 'Organization created successfully',
        data: organization,
      };
    } catch (error) {
      this.logger.error('Error in create organization:', error);
      throw error;
    }
  }

  async findAll(query: QueryOrganizationDto) {
    try {
      const { data, error, count } = await this.supabaseService.getOrganizations(
        query.page,
        query.limit,
        query.search
      );

      if (error) {
        this.logger.error('Error fetching organizations:', error);
        throw new InternalServerErrorException('Failed to fetch organizations');
      }

      return {
        data,
        meta: {
          total: count,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(count / query.limit)
        }
      };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabaseService.getOrganizationById(id);

      if (error) {
        this.logger.error('Error fetching organization:', error);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!data) {
        throw new NotFoundException('Organization not found');
      }

      return { data };
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const { data, error } = await this.supabaseService.getOrganizationBySlug(slug);

      if (error) {
        this.logger.error('Error fetching organization:', error);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!data) {
        throw new NotFoundException('Organization not found');
      }

      return { data };
    } catch (error) {
      this.logger.error('Error in findBySlug:', error);
      throw error;
    }
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    try {
      // First check if organization exists
      const { data: existingOrg, error: fetchError } = await this.supabaseService.getOrganizationById(id);

      if (fetchError) {
        this.logger.error('Error fetching organization:', fetchError);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!existingOrg) {
        throw new NotFoundException('Organization not found');
      }

      // If slug is being updated, check for duplicates
      if (updateOrganizationDto.slug && updateOrganizationDto.slug !== existingOrg.slug) {
        const { data: duplicateOrg, error: slugError } = await this.supabaseService.getOrganizationBySlug(
          updateOrganizationDto.slug
        );

        if (slugError) {
          this.logger.error('Error checking duplicate slug:', slugError);
          throw new InternalServerErrorException('Error checking duplicate slug');
        }

        if (duplicateOrg) {
          throw new ConflictException('Organization with this slug already exists');
        }
      }

      // Update organization
      const { data: updatedOrg, error: updateError } = await this.supabaseService.updateOrganization(
        id,
        updateOrganizationDto
      );

      if (updateError) {
        this.logger.error('Error updating organization:', updateError);
        throw new InternalServerErrorException('Failed to update organization');
      }

      return {
        message: 'Organization updated successfully',
        data: updatedOrg,
      };
    } catch (error) {
      this.logger.error('Error in update organization:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // First check if organization exists
      const { data: existingOrg, error: fetchError } = await this.supabaseService.getOrganizationById(id);

      if (fetchError) {
        this.logger.error('Error fetching organization:', fetchError);
        throw new InternalServerErrorException('Failed to fetch organization');
      }

      if (!existingOrg) {
        throw new NotFoundException('Organization not found');
      }

      // Delete organization
      const { error: deleteError } = await this.supabaseService.deleteOrganization(id);

      if (deleteError) {
        this.logger.error('Error deleting organization:', deleteError);
        throw new InternalServerErrorException('Failed to delete organization');
      }

      return {
        message: 'Organization deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error in remove organization:', error);
      throw error;
    }
  }
}
