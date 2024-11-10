import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../services/supabase.service';
import { RequestContextService } from '../services/request-context.service';
import { Role, Permission } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
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
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token with Supabase
      const { user, error } = await this.supabaseService.verifyToken(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user roles and permissions
      const [roles, permissions] = await Promise.all([
        this.supabaseService.getUserRoles(user.id),
        this.supabaseService.getUserPermissions(user.id),
      ]);

      // Check required roles
      const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler()) || [];
      if (requiredRoles.length > 0 && !this.matchRoles(requiredRoles, roles)) {
        throw new ForbiddenException('Insufficient role permissions');
      }

      // Check required permissions
      const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler()) || [];
      if (requiredPermissions.length > 0 && !this.matchPermissions(requiredPermissions, permissions)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      // Get tenant ID
      const tenantId = await this.supabaseService.getTenantId(user.id);

      // Set user and tenant info in request context
      const userContext = {
        id: user.id,
        email: user.email,
        roles,
        permissions,
        tenantId,
        metadata: user.user_metadata,
      };

      request.user = userContext;
      this.contextService.set('userContext', userContext);
      
      if (tenantId) {
        this.contextService.set('tenantId', tenantId);
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to authenticate user');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private matchRoles(requiredRoles: Role[], userRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private matchPermissions(requiredPermissions: Permission[], userPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
}
