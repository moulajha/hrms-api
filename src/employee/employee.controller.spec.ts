import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto, Gender } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { SupabaseService } from '../common/services/supabase.service';
import { RequestContextService } from '../common/services/request-context.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
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
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEmployeeDto: CreateEmployeeDto = {
      firstName: 'John',
      lastName: 'Doe',
      officialEmail: 'john.doe@company.com',
      mobileNumber: '1234567890',
      gender: Gender.MALE,
      joinDate: '2024-01-01',
      employeeTypeId: '123e4567-e89b-12d3-a456-426614174000',
      statusId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    };

    const mockResponse = {
      id: 'emp-uuid',
      ...createEmployeeDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should create a new employee', async () => {
      mockEmployeeService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createEmployeeDto);

      expect(service.create).toHaveBeenCalledWith(createEmployeeDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryEmployeeDto = {
      search: 'John',
      page: 1,
      limit: 10,
    };

    const mockResponse = {
      data: [
        {
          id: 'emp-uuid-1',
          firstName: 'John',
          lastName: 'Doe',
          officialEmail: 'john.doe@company.com',
          gender: Gender.MALE,
          joinDate: '2024-01-01',
        },
        {
          id: 'emp-uuid-2',
          firstName: 'Jane',
          lastName: 'Doe',
          officialEmail: 'jane.doe@company.com',
          gender: Gender.FEMALE,
          joinDate: '2024-01-02',
        },
      ],
      meta: {
        total: 2,
        page: 1,
        limit: 10,
      },
    };

    it('should return paginated list of employees', async () => {
      mockEmployeeService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    const empId = 'emp-uuid';
    const mockResponse = {
      id: empId,
      firstName: 'John',
      lastName: 'Doe',
      officialEmail: 'john.doe@company.com',
      mobileNumber: '1234567890',
      gender: Gender.MALE,
      joinDate: '2024-01-01',
      employeeTypeId: '123e4567-e89b-12d3-a456-426614174000',
      statusId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    };

    it('should return employee by ID', async () => {
      mockEmployeeService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(empId);

      expect(service.findOne).toHaveBeenCalledWith(empId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    const empId = 'emp-uuid';
    const updateEmployeeDto: UpdateEmployeeDto = {
      firstName: 'Johnny',
      lastName: 'Doe Jr',
      mobileNumber: '9876543210',
      gender: Gender.MALE,
      statusId: '123e4567-e89b-12d3-a456-426614174003',
    };

    const mockResponse = {
      id: empId,
      ...updateEmployeeDto,
      officialEmail: 'john.doe@company.com',
      joinDate: '2024-01-01',
      employeeTypeId: '123e4567-e89b-12d3-a456-426614174000',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
      updatedAt: new Date().toISOString(),
    };

    it('should update employee', async () => {
      mockEmployeeService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(empId, updateEmployeeDto);

      expect(service.update).toHaveBeenCalledWith(empId, updateEmployeeDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    const empId = 'emp-uuid';
    const mockResponse = {
      message: 'Employee deleted successfully',
    };

    it('should delete employee', async () => {
      mockEmployeeService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(empId);

      expect(service.remove).toHaveBeenCalledWith(empId);
      expect(result).toEqual(mockResponse);
    });
  });
});
