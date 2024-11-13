import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { Role } from '../common/decorators/roles.decorator';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(email: string, password: string) {
    try {
      // First attempt to sign in
      const { data, error } = await this.supabaseService.signIn(email, password);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      if (!data?.user) {
        throw new UnauthorizedException('User not found');
      }

      // Get user profile first
      const profile = await this.supabaseService.getUserProfile(data.user.id);
      
      if (!profile?.organization_id) {
        throw new UnauthorizedException('User not associated with any organization');
      }

      // Then get roles and permissions
      const [roles, permissions] = await Promise.all([
        this.supabaseService.getUserRoles(data.user.id),
        this.supabaseService.getUserPermissions(data.user.id),
      ]);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: {
            ...profile,
            organization: profile.organizations,
          },
          roles: roles || [],
          permissions: permissions || [],
        },
        session: data.session,
      };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async signUp(email: string, password: string, organizationId: string, role: Role = Role.EMPLOYEE) {
    try {
      // Validate organizationId
      const organizationExists = await this.supabaseService.checkOrganizationExists(organizationId);
      if (!organizationExists) {
        throw new UnauthorizedException('Invalid organization ID');
      }

      // Proceed with signup
      const { data, error } = await this.supabaseService.signUp(email, password, organizationId, role);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      if (!data?.user) {
        throw new UnauthorizedException('Failed to create user');
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
        },
        session: data.session,
      };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async signOut(token: string) {
    try {
      const { error } = await this.supabaseService.signOut(token);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return { message: 'Successfully signed out' };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabaseService.resetPassword(email);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return { message: 'Password reset email sent' };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await this.supabaseService.updatePassword(newPassword);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return { message: 'Password updated successfully' };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async refreshSession() {
    try {
      const { data, error } = await this.supabaseService.refreshSession();
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      return {
        session: data.session,
      };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  private handleAuthError(error: any) {
    console.error('Auth error:', error);
    
    if (error instanceof UnauthorizedException) {
      throw error;
    }

    if (error?.message?.includes('JSON object requested')) {
      throw new UnauthorizedException('Invalid credentials or user not found');
    }

    throw new InternalServerErrorException('Authentication failed');
  }
}
