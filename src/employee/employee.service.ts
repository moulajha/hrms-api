import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { RequestContextService } from '../common/services/request-context.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly contextService: RequestContextService,
  ) {}

  async findAll(query: QueryEmployeeDto) {
    try {
      const userContext = this.contextService.getUserContext();
      if (!userContext) {
        throw new BadRequestException('User context not found');
      }

      const { data, error, count } = await this.supabaseService.getEmployees(
        userContext.tenantId,
        query.page,
        query.limit,
        query.search
      );

      if (error) {
        this.logger.error('Error fetching employees:', error);
        throw new InternalServerErrorException('Failed to fetch employees');
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
      const userContext = this.contextService.getUserContext();
      if (!userContext) {
        throw new BadRequestException('User context not found');
      }

      const { data, error } = await this.supabaseService.getEmployeeById(id, userContext.tenantId);

      if (error) {
        this.logger.error('Error fetching employee:', error);
        throw new InternalServerErrorException('Failed to fetch employee');
      }

      if (!data) {
        throw new NotFoundException('Employee not found');
      }

      return { data };
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    try {
      const userContext = this.contextService.getUserContext();
      this.logger.debug('User context:', userContext);
      
      if (!userContext) {
        throw new BadRequestException('User context not found');
      }

      // Log incoming request data
      this.logger.debug('Creating employee with data:', {
        ...createEmployeeDto,
        officialEmail: '***@***.***' // Mask sensitive data in logs
      });

      // Validate required fields and ensure they are not undefined
      if (!createEmployeeDto.organizationId) {
        throw new BadRequestException('Organization ID is required');
      }
      if (!createEmployeeDto.employeeTypeId) {
        throw new BadRequestException('Employee Type ID is required');
      }
      if (!createEmployeeDto.statusId) {
        throw new BadRequestException('Status ID is required');
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
      const { data: existingEmployee, error: existingError } = await this.supabaseService.checkExistingEmployee(createEmployeeDto.officialEmail);

      if (existingError) {
        this.logger.error('Error checking existing employee:', existingError);
        throw new InternalServerErrorException('Error checking existing employee');
      }

      if (existingEmployee) {
        this.logger.warn('Attempt to create duplicate employee:', createEmployeeDto.officialEmail);
        throw new ConflictException('Employee with this email already exists');
      }

      // Get all employee types for the organization to provide helpful error message
      const { data: allEmployeeTypes, error: typesError } = await this.supabaseService.getEmployeeTypes(createEmployeeDto.organizationId);

      if (typesError) {
        this.logger.error('Error fetching employee types:', typesError);
        throw new InternalServerErrorException('Error fetching employee types');
      }

      // Verify employee type exists and belongs to organization
      this.logger.debug('Verifying employee type:', {
        typeId: createEmployeeDto.employeeTypeId,
        orgId: createEmployeeDto.organizationId
      });

      const { data: employeeType, error: typeError } = await this.supabaseService.verifyEmployeeType(
        createEmployeeDto.employeeTypeId,
        createEmployeeDto.organizationId
      );

      if (typeError) {
        this.logger.error('Error checking employee type:', typeError);
        throw new BadRequestException(`Error checking employee type: ${typeError.message}`);
      }

      if (!employeeType) {
        this.logger.warn('Employee type not found:', {
          typeId: createEmployeeDto.employeeTypeId,
          orgId: createEmployeeDto.organizationId,
          availableTypes: allEmployeeTypes
        });

        const availableTypes = allEmployeeTypes.map(type => `${type.name} (${type.id})`).join(', ');
        throw new BadRequestException(
          `Invalid employee type ID. Available types for your organization are: ${availableTypes}`
        );
      }

      // Verify status exists and belongs to organization
      this.logger.debug('Verifying employee status:', {
        statusId: createEmployeeDto.statusId,
        orgId: createEmployeeDto.organizationId
      });

      const { data: status, error: statusError } = await this.supabaseService.verifyEmployeeStatus(
        createEmployeeDto.statusId,
        createEmployeeDto.organizationId
      );

      if (statusError) {
        this.logger.error('Error checking employee status:', statusError);
        throw new BadRequestException(`Error checking employee status: ${statusError.message}`);
      }

      if (!status) {
        this.logger.warn('Employee status not found:', {
          statusId: createEmployeeDto.statusId,
          orgId: createEmployeeDto.organizationId
        });
        throw new BadRequestException(`Employee status with ID ${createEmployeeDto.statusId} not found or not associated with organization ${createEmployeeDto.organizationId}`);
      }

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
        created_by: userContext.id,
        updated_by: userContext.id,
      };

      this.logger.debug('Creating employee with payload:', {
        ...employeePayload,
        official_email: '***@***.***' // Mask sensitive data in logs
      });

      const { data: employee, error: createError } = await this.supabaseService.createEmployee(employeePayload);

      if (createError) {
        this.logger.error('Error creating employee:', createError);
        throw new InternalServerErrorException('Failed to create employee');
      }

      this.logger.debug('Employee created successfully:', {
        id: employee.id,
        email: '***@***.***' // Mask sensitive data in logs
      });

      return {
        message: 'Employee created successfully',
        data: employee,
      };
    } catch (error) {
      this.logger.error('Error in create employee:', error);
      
      // If it's already an HTTP exception, rethrow it
      if (error.status) {
        throw error;
      }
      
      // Otherwise wrap it in an internal server error
      throw new InternalServerErrorException('Failed to create employee');
    }
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const userContext = this.contextService.getUserContext();
      if (!userContext) {
        throw new BadRequestException('User context not found');
      }

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
        throw new NotFoundException('Employee not found');
      }

      // If email is being updated, check for duplicates
      if (updateEmployeeDto.officialEmail && updateEmployeeDto.officialEmail !== existingEmployee.official_email) {
        const { data: duplicateEmployee, error: duplicateError } = await this.supabaseService.checkExistingEmployee(
          updateEmployeeDto.officialEmail
        );

        if (duplicateError) {
          this.logger.error('Error checking duplicate email:', duplicateError);
          throw new InternalServerErrorException('Error checking duplicate email');
        }

        if (duplicateEmployee) {
          throw new ConflictException('Employee with this email already exists');
        }
      }

      // If employee type is being updated, verify it exists
      if (updateEmployeeDto.employeeTypeId) {
        const { data: employeeType, error: typeError } = await this.supabaseService.verifyEmployeeType(
          updateEmployeeDto.employeeTypeId,
          userContext.tenantId
        );

        if (typeError) {
          this.logger.error('Error checking employee type:', typeError);
          throw new BadRequestException(`Error checking employee type: ${typeError.message}`);
        }

        if (!employeeType) {
          throw new BadRequestException('Invalid employee type ID');
        }
      }

      // If status is being updated, verify it exists
      if (updateEmployeeDto.statusId) {
        const { data: status, error: statusError } = await this.supabaseService.verifyEmployeeStatus(
          updateEmployeeDto.statusId,
          userContext.tenantId
        );

        if (statusError) {
          this.logger.error('Error checking employee status:', statusError);
          throw new BadRequestException(`Error checking employee status: ${statusError.message}`);
        }

        if (!status) {
          throw new BadRequestException('Invalid employee status ID');
        }
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

      // Update employee
      const { data: updatedEmployee, error: updateError } = await this.supabaseService.updateEmployee(
        id,
        userContext.tenantId,
        updatePayload
      );

      if (updateError) {
        this.logger.error('Error updating employee:', updateError);
        throw new InternalServerErrorException('Failed to update employee');
      }

      return {
        message: 'Employee updated successfully',
        data: updatedEmployee,
      };
    } catch (error) {
      this.logger.error('Error in update employee:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const userContext = this.contextService.getUserContext();
      if (!userContext) {
        throw new BadRequestException('User context not found');
      }

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
        throw new NotFoundException('Employee not found');
      }

      // Delete employee
      const { error: deleteError } = await this.supabaseService.deleteEmployee(id, userContext.tenantId);

      if (deleteError) {
        this.logger.error('Error deleting employee:', deleteError);
        throw new InternalServerErrorException('Failed to delete employee');
      }

      return {
        message: 'Employee deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error in remove employee:', error);
      throw error;
    }
  }
}
