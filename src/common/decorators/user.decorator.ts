import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from './roles.decorator';

export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  permissions: string[];
  tenantId: string;
  isActive: boolean;
  token?: string;
  metadata?: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: keyof IUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: IUser = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);

// Decorator for requiring authentication
export const Public = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('isPublic', true, descriptor?.value || target);
    return descriptor;
  };
};

// Decorator for optional authentication
export const OptionalAuth = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('isOptionalAuth', true, descriptor?.value || target);
    return descriptor;
  };
};
