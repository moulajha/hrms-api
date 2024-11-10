import { Role, Permission } from './roles.decorator';
import { IUser } from './user.decorator';

// API Version
export * from './api-version.decorator';

// Authentication & Authorization
export * from './roles.decorator';
export * from './user.decorator';

// Multi-tenancy
export * from './tenant.decorator';

// Validation
export * from './validation.decorator';

// Monitoring & Tracing
export * from './trace.decorator';

// Decorator composition helpers
export const RequirePermissions = (...permissions: Permission[]) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('permissions', permissions, descriptor?.value || target);
    return descriptor;
  };
};

export const RequireRoles = (...roles: Role[]) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('roles', roles, descriptor?.value || target);
    return descriptor;
  };
};

// Example usage:
/*
@Controller('employees')
@RequireRoles(Role.HR_MANAGER)
export class EmployeeController {
  @Post()
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  @Trace({ name: 'createEmployee' })
  async createEmployee(
    @CurrentUser() user: IUser,
    @CurrentTenant() tenant: any,
    @Body() createEmployeeDto: CreateEmployeeDto
  ) {
    // Implementation
  }
}
*/
