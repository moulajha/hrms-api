import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthBaseService } from './auth-base.service';

@Injectable()
export class AuthQueryService extends AuthBaseService {
  async getUserProfile(userId: string) {
    try {
      // Try to get from cache first
      const cachedUser = await this.getUserFromCache(userId);
      if (cachedUser) {
        return cachedUser;
      }

      // Get user profile
      const profile = await this.supabaseService.getUserProfile(userId);
      
      if (!profile?.organization_id) {
        throw new UnauthorizedException('User not associated with any organization');
      }

      // Get roles and permissions
      const [roles, permissions] = await Promise.all([
        this.supabaseService.getUserRoles(userId),
        this.supabaseService.getUserPermissions(userId),
      ]);

      // Return user data without wrapping in data object
      const userData = {
        profile: {
          ...profile,
          organization: profile.organizations,
        },
        roles: roles || [],
        permissions: permissions || [],
      };

      // Cache the user data
      await this.cacheService.set(`user:${userId}`, userData, {
        ttl: 30 * 60 * 1000, // 30 minutes
        tags: [`user:${userId}`, 'users']
      });

      return userData;
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async verifySession(token: string) {
    try {
      const { user, error } = await this.supabaseService.verifyToken(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      return user;
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

      // Return session data without wrapping in data object
      const sessionData = {
        session: {
          access_token: data.session?.access_token,
          token_type: data.session?.token_type,
          expires_in: data.session?.expires_in,
          refresh_token: data.session?.refresh_token,
        }
      };

      if (data.session && data.user) {
        await this.cacheUserSession(data.user.id, data.session);
      }

      return sessionData;
    } catch (error) {
      this.handleAuthError(error);
    }
  }
}
