import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthBaseService } from './auth-base.service';
import { Role } from '../../common/decorators/roles.decorator';

@Injectable()
export class AuthCommandService extends AuthBaseService {
  async signIn(email: string, password: string) {
    try {
      // Attempt to sign in
      const { data, error } = await this.supabaseService.signIn(email, password);
      
      if (error) {
        throw new UnauthorizedException(error.message);
      }

      if (!data?.user) {
        throw new UnauthorizedException('User not found');
      }

      // Get user profile
      const profile = await this.supabaseService.getUserProfile(data.user.id);
      
      if (!profile?.organization_id) {
        throw new UnauthorizedException('User not associated with any organization');
      }

      // Get roles and permissions
      const [roles, permissions] = await Promise.all([
        this.supabaseService.getUserRoles(data.user.id),
        this.supabaseService.getUserPermissions(data.user.id),
      ]);

      // Return user data without wrapping in data object
      const userData = {
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
        session: {
          access_token: data.session?.access_token,
          token_type: data.session?.token_type,
          expires_in: data.session?.expires_in,
          refresh_token: data.session?.refresh_token,
        }
      };

      // Cache user data and session
      await Promise.all([
        this.cacheUserSession(data.user.id, data.session),
        this.cacheService.set(`user:${data.user.id}`, userData.user, {
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: [`user:${data.user.id}`, 'users']
        })
      ]);

      return userData;
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

      // Return user data without wrapping in data object
      const userData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
        },
        session: {
          access_token: data.session?.access_token,
          token_type: data.session?.token_type,
          expires_in: data.session?.expires_in,
          refresh_token: data.session?.refresh_token,
        }
      };

      // Cache the session if available
      if (data.session) {
        await this.cacheUserSession(data.user.id, data.session);
      }

      return userData;
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async signOut(token: string) {
    try {
      const { user, error: verifyError } = await this.supabaseService.verifyToken(token);
      
      if (user) {
        // Invalidate user caches
        await this.invalidateUserCache(user.id);
      }

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

      // If password update successful, invalidate user's sessions
      if (data?.user) {
        await this.invalidateUserCache(data.user.id);
      }

      return { message: 'Password updated successfully' };
    } catch (error) {
      this.handleAuthError(error);
    }
  }
}
