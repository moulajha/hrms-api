import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateInitialOrganizationDto } from './dto/create-initial-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { OrganizationQueryService } from './services/organization-query.service';
import { OrganizationCommandService } from './services/organization-command.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly queryService: OrganizationQueryService,
    private readonly commandService: OrganizationCommandService,
  ) {}

  // Query Methods
  async findAll(query: QueryOrganizationDto) {
    return this.queryService.findAll(query);
  }

  async findOne(id: string) {
    return this.queryService.findOne(id);
  }

  async findBySlug(slug: string) {
    return this.queryService.findBySlug(slug);
  }

  // Command Methods
  async createInitialOrganization(createInitialOrganizationDto: CreateInitialOrganizationDto) {
    return this.commandService.createInitialOrganization(createInitialOrganizationDto);
  }

  async create(createOrganizationDto: CreateOrganizationDto) {
    return this.commandService.create(createOrganizationDto);
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    return this.commandService.update(id, updateOrganizationDto);
  }

  async remove(id: string) {
    return this.commandService.remove(id);
  }
}
