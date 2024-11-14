import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateInitialOrganizationDto } from './dto/create-initial-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { QueryOrganizationDto } from './dto/query-organization.dto';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;

  const mockOrganizationService = {
    createInitialOrganization: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(),
    createClient: jest.fn(),
  };

  const mockRequestContextService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: RequestContextService,
          useValue: mockRequestContextService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
    service = module.get<OrganizationService>(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInitialOrganization', () => {
    const createInitialOrgDto: CreateInitialOrganizationDto = {
      name: 'Test Org',
      slug: 'test-org',
      email: 'admin@test.com',
      admin_password: 'Password123!',
    };

    const mockResponse = {
      organization: {
        id: 'org-uuid',
        name: 'Test Org',
        slug: 'test-org',
        email: 'admin@test.com',
        createdAt: new Date().toISOString(),
      },
      admin: {
        id: 'user-uuid',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN',
      },
    };

    it('should create initial organization and super admin', async () => {
      mockOrganizationService.createInitialOrganization.mockResolvedValue(mockResponse);

      const result = await controller.createInitialOrganization(createInitialOrgDto);

      expect(service.createInitialOrganization).toHaveBeenCalledWith(createInitialOrgDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    const createOrgDto: CreateOrganizationDto = {
      name: 'New Org',
      slug: 'new-org',
      email: 'contact@neworg.com',
      phone: '+1234567890',
      address: '123 Business St',
      gstin: 'GSTIN123456789',
      pan: 'PAN123456789',
    };

    const mockResponse = {
      id: 'org-uuid',
      ...createOrgDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should create a new organization', async () => {
      mockOrganizationService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createOrgDto);

      expect(service.create).toHaveBeenCalledWith(createOrgDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryOrganizationDto = {
      page: 1,
      limit: 10,
      search: 'test',
    };

    const mockResponse = {
      data: [
        {
          id: 'org-uuid-1',
          name: 'Test Org 1',
          slug: 'test-org-1',
          email: 'contact@testorg1.com',
        },
        {
          id: 'org-uuid-2',
          name: 'Test Org 2',
          slug: 'test-org-2',
          email: 'contact@testorg2.com',
        },
      ],
      meta: {
        total: 2,
        page: 1,
        limit: 10,
      },
    };

    it('should return paginated list of organizations', async () => {
      mockOrganizationService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    const orgId = 'org-uuid';
    const mockResponse = {
      id: orgId,
      name: 'Test Org',
      slug: 'test-org',
      email: 'contact@testorg.com',
      phone: '+1234567890',
      address: '123 Business St',
      gstin: 'GSTIN123456789',
      pan: 'PAN123456789',
    };

    it('should return organization by ID', async () => {
      mockOrganizationService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(orgId);

      expect(service.findOne).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findBySlug', () => {
    const slug = 'test-org';
    const mockResponse = {
      id: 'org-uuid',
      name: 'Test Org',
      slug: slug,
      email: 'contact@testorg.com',
      phone: '+1234567890',
      address: '123 Business St',
    };

    it('should return organization by slug', async () => {
      mockOrganizationService.findBySlug.mockResolvedValue(mockResponse);

      const result = await controller.findBySlug(slug);

      expect(service.findBySlug).toHaveBeenCalledWith(slug);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    const orgId = 'org-uuid';
    const updateOrgDto: UpdateOrganizationDto = {
      name: 'Updated Org',
      email: 'updated@testorg.com',
      phone: '+9876543210',
    };

    const mockResponse = {
      id: orgId,
      ...updateOrgDto,
      slug: 'test-org',
      updatedAt: new Date().toISOString(),
    };

    it('should update organization', async () => {
      mockOrganizationService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(orgId, updateOrgDto);

      expect(service.update).toHaveBeenCalledWith(orgId, updateOrgDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    const orgId = 'org-uuid';
    const mockResponse = {
      message: 'Organization deleted successfully',
    };

    it('should delete organization', async () => {
      mockOrganizationService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(orgId);

      expect(service.remove).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockResponse);
    });
  });
});
