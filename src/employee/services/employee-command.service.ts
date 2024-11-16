import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { EmployeeBaseService } from './employee-base.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { SupabaseService } from '../../common/services/supabase.service';
import { CacheService } from '../../common/services/cache.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { EmployeeCodeService } from './employee-code.service';

@Injectable()
export class EmployeeCommandService extends EmployeeBaseService {
  constructor(
    protected readonly supabaseService: SupabaseService,
    protected readonly contextService: RequestContextService,
    protected readonly cacheService: CacheService,
    private readonly employeeCodeService: EmployeeCodeService,
  ) {
    super(supabaseService, contextService, cacheService);
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    try {
      const userContext = await this.validateUserContext();
      
      // Log incoming request data
      this.logger.debug('Creating employee with data:', 
        this.maskSensitiveData(createEmployeeDto)
      );

      // Validate required fields
      if (!createEmployeeDto.organizationId) {
        throw new BadRequestException('Organization ID is required');
      }

      // Verify organization ID matches user's organization
      if (createEmployeeDto.organizationId !== userContext.tenantId) {
        this.logger.warn('Organization ID mismatch', {
          providedOrgId: createEmployeeDto.organizationId,
          userOrgId: userContext.tenantId
        });
        throw new BadRequestException('Invalid organization ID - does not match user context');
      }

      // Check if employee with email already exists
      const { data: existingEmployee, error: existingError } = await this.supabaseService.checkExistingEmployee(
        createEmployeeDto.officialEmail
      );

      if (existingError) {
        this.logger.error('Error checking existing employee:', existingError);
        throw new InternalServerErrorException('Error checking existing employee');
      }

      if (existingEmployee) {
        this.logger.warn('Attempt to create duplicate employee:', createEmployeeDto.officialEmail);
        throw new ConflictException('Employee with this email already exists');
      }

      // Generate employee code
      const employeeCode = await this.employeeCodeService.generateEmployeeCode(createEmployeeDto.organizationId);

      // Verify employee type and status
      await this.verifyEmployeeTypeAndStatus(createEmployeeDto);

      // Create employee
      const employeePayload = {
        first_name: createEmployeeDto.firstName,
        last_name: createEmployeeDto.lastName,
        official_email: createEmployeeDto.officialEmail,
        mobile_number: createEmployeeDto.mobileNumber,
        gender: createEmployeeDto.gender,
        join_date: createEmployeeDto.joinDate,
        employee_type_id: createEmployeeDto.employeeTypeId,
        status_id: createEmployeeDto.statusId,
        organization_id: createEmployeeDto.organizationId,
        employee_code: employeeCode,
        created_by: userContext.id,
        updated_by: userContext.id,
      };

      this.logger.debug('Creating employee with payload:', 
        this.maskSensitiveData(employeePayload)
      );

      const { data: employee, error: createError } = await this.supabaseService.createEmployee(employeePayload);

      if (createError) {
        this.logger.error('Error creating employee:', createError);
        throw new InternalServerErrorException('Failed to create employee');
      }

      // Invalidate relevant caches
      await this.invalidateEmployeeCache(employee.id, userContext.tenantId);

      this.logger.debug('Employee created successfully:', {
        id: employee.id,
        email: '***@***.***',
        code: employee.employee_code
      });

      return employee;
    } catch (error) {
      this.logger.error('Error in create employee:', error);
      if (error.status) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create employee');
    }
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const userContext = await this.validateUserContext();

      // First check if employee exists and belongs to organization
      const { data: existingEmployee, error: fetchError } = await this.supabaseService.getEmployeeById(
        id,
        userContext.tenantId
      );

      if (fetchError) {
        this.logger.error('Error fetching employee:', fetchError);
        throw new InternalServerErrorException('Failed to fetch employee');
      }

      if (!existingEmployee) {
        throw new BadRequestException('Employee not found');
      }

      // Check email uniqueness if being updated
      if (updateEmployeeDto.officialEmail && updateEmployeeDto.officialEmail !== existingEmployee.official_email) {
        await this.checkEmailUniqueness(updateEmployeeDto.officialEmail);
      }

      // Verify type and status if being updated
      if (updateEmployeeDto.employeeTypeId || updateEmployeeDto.statusId) {
        await this.verifyEmployeeTypeAndStatus({
          ...updateEmployeeDto,
          organizationId: userContext.tenantId
        });
      }

      // Prepare update payload
      const updatePayload = {
        ...(updateEmployeeDto.firstName && { first_name: updateEmployeeDto.firstName }),
        ...(updateEmployeeDto.lastName && { last_name: updateEmployeeDto.lastName }),
        ...(updateEmployeeDto.officialEmail && { official_email: updateEmployeeDto.officialEmail }),
        ...(updateEmployeeDto.mobileNumber && { mobile_number: updateEmployeeDto.mobileNumber }),
        ...(updateEmployeeDto.gender && { gender: updateEmployeeDto.gender }),
        ...(updateEmployeeDto.joinDate && { join_date: updateEmployeeDto.joinDate }),
        ...(updateEmployeeDto.employeeTypeId && { employee_type_id: updateEmployeeDto.employeeTypeId }),
        ...(updateEmployeeDto.statusId && { status_id: updateEmployeeDto.statusId }),
        updated_by: userContext.id,
      };

      const { data: updatedEmployee, error: updateError } = await this.supabaseService.updateEmployee(
        id,
        userContext.tenantId,
        updatePayload
      );

      if (updateError) {
        this.logger.error('Error updating employee:', updateError);
        throw new InternalServerErrorException('Failed to update employee');
      }

      // Invalidate relevant caches
      await this.invalidateEmployeeCache(id, userContext.tenantId);

      return updatedEmployee;
    } catch (error) {
      this.logger.error('Error in update employee:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const userContext = await this.validateUserContext();

      // First check if employee exists and belongs to organization
      const { data: existingEmployee, error: fetchError } = await this.supabaseService.getEmployeeById(
        id,
        userContext.tenantId
      );

      if (fetchError) {
        this.logger.error('Error fetching employee:', fetchError);
        throw new InternalServerErrorException('Failed to fetch employee');
      }

      if (!existingEmployee) {
        throw new BadRequestException('Employee not found');
      }

      // Delete employee
      const { error: deleteError } = await this.supabaseService.deleteEmployee(id, userContext.tenantId);

      if (deleteError) {
        this.logger.error('Error deleting employee:', deleteError);
        throw new InternalServerErrorException('Failed to delete employee');
      }

      // Invalidate relevant caches
      await this.invalidateEmployeeCache(id, userContext.tenantId);

      return { message: 'Employee deleted successfully' };
    } catch (error) {
      this.logger.error('Error in remove employee:', error);
      throw error;
    }
  }

  private async verifyEmployeeTypeAndStatus(dto: { employeeTypeId?: string; statusId?: string; organizationId: string }) {
    if (dto.employeeTypeId) {
      const { data: employeeType, error: typeError } = await this.supabaseService.verifyEmployeeType(
        dto.employeeTypeId,
        dto.organizationId
      );

      if (typeError) {
        this.logger.error('Error checking employee type:', typeError);
        throw new BadRequestException(`Error checking employee type: ${typeError.message}`);
      }

      if (!employeeType) {
        throw new BadRequestException('Invalid employee type ID');
      }
    }

    if (dto.statusId) {
      const { data: status, error: statusError } = await this.supabaseService.verifyEmployeeStatus(
        dto.statusId,
        dto.organizationId
      );

      if (statusError) {
        this.logger.error('Error checking employee status:', statusError);
        throw new BadRequestException(`Error checking employee status: ${statusError.message}`);
      }

      if (!status) {
        throw new BadRequestException('Invalid employee status ID');
      }
    }
  }

  private async checkEmailUniqueness(email: string) {
    const { data: duplicateEmployee, error: duplicateError } = await this.supabaseService.checkExistingEmployee(email);

    if (duplicateError) {
      this.logger.error('Error checking duplicate email:', duplicateError);
      throw new InternalServerErrorException('Error checking duplicate email');
    }

    if (duplicateEmployee) {
      throw new ConflictException('Employee with this email already exists');
    }
  }
}
