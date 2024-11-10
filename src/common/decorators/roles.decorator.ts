import { SetMetadata } from '@nestjs/common';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  HR_EXECUTIVE = 'HR_EXECUTIVE',
  EMPLOYEE = 'EMPLOYEE',
}

export enum Permission {
  // Employee Management
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  READ_EMPLOYEE = 'READ_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE',
  
  // Leave Management
  MANAGE_LEAVE = 'MANAGE_LEAVE',
  APPROVE_LEAVE = 'APPROVE_LEAVE',
  REQUEST_LEAVE = 'REQUEST_LEAVE',
  
  // Attendance Management
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  MARK_ATTENDANCE = 'MARK_ATTENDANCE',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  
  // Payroll Management
  MANAGE_PAYROLL = 'MANAGE_PAYROLL',
  VIEW_PAYROLL = 'VIEW_PAYROLL',
  
  // Document Management
  MANAGE_DOCUMENTS = 'MANAGE_DOCUMENTS',
  VIEW_DOCUMENTS = 'VIEW_DOCUMENTS',
  
  // Settings & Configuration
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_SETTINGS = 'VIEW_SETTINGS',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Combined decorator for both roles and permissions
export function Auth(roles: Role[] = [], permissions: Permission[] = []) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (roles.length) {
      Roles(...roles)(target, propertyKey, descriptor);
    }
    if (permissions.length) {
      Permissions(...permissions)(target, propertyKey, descriptor);
    }
  };
}
