import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../services/supabase.service';
import { RequestContextService } from '../services/request-context.service';
import { Role, Permission } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
    private contextService: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      this.logger.error('No token provided in request');
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token with Supabase
      const { user, error } = await this.supabaseService.verifyToken(token);
      
      if (error) {
        this.logger.error(`Token verification failed: ${error.message}`);
        throw new UnauthorizedException('Invalid token');
      }

      if (!user) {
        this.logger.error('No user found for token');
        throw new UnauthorizedException('Invalid token');
      }

      // Get user roles and permissions from Supabase metadata
      const [roles, permissions] = await Promise.all([
        this.supabaseService.getUserRoles(user.id),
        this.supabaseService.getUserPermissions(user.id),
      ]);

      // Check required roles
      const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler()) || [];
      if (requiredRoles.length > 0 && !this.matchRoles(requiredRoles, roles)) {
        this.logger.warn(`User ${user.id} lacks required roles: ${requiredRoles.join(', ')}`);
        throw new ForbiddenException('Insufficient role permissions');
      }

      // Check required permissions
      const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler()) || [];
      if (requiredPermissions.length > 0 && !this.matchPermissions(requiredPermissions, permissions)) {
        this.logger.warn(`User ${user.id} lacks required permissions: ${requiredPermissions.join(', ')}`);
        throw new ForbiddenException('Insufficient permissions');
      }

      // Get tenant ID from user metadata
      const tenantId = user.user_metadata?.tenant_id || null;

      // Set user and tenant info in request context
      const userContext = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || Role.EMPLOYEE,
        roles,
        permissions,
        tenantId,
        metadata: user.user_metadata,
        token,
      };

      request.user = userContext;
      this.contextService.set('userContext', userContext);
      
      if (tenantId) {
        this.contextService.set('tenantId', tenantId);
      }

      this.logger.debug(`Successfully authenticated user ${user.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to authenticate user');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.debug('No authorization header found');
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      this.logger.debug(`Invalid authorization type: ${type}`);
      return undefined;
    }

    if (!token) {
      this.logger.debug('No token found in authorization header');
      return undefined;
    }

    return token;
  }

  private matchRoles(requiredRoles: Role[], userRoles: string[]): boolean {
    // If user has SUPER_ADMIN role, they have access to everything
    if (userRoles.includes(Role.SUPER_ADMIN)) {
      return true;
    }
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private matchPermissions(requiredPermissions: Permission[], userPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}
