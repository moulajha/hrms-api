import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { Role } from '../common/decorators/roles.decorator';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.signIn(email, password);
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data?.user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user profile, roles and permissions
    const [profile, roles, permissions] = await Promise.all([
      this.supabaseService.getUserProfile(data.user.id),
      this.supabaseService.getUserRoles(data.user.id),
      this.supabaseService.getUserPermissions(data.user.id),
    ]);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        profile,
        roles,
        permissions,
      },
      session: data.session,
    };
  }

  async signUp(email: string, password: string, organizationId: string, role: Role = Role.EMPLOYEE) {
    // Start a transaction
    const transaction = await this.supabaseService.startTransaction();

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

      // Commit transaction
      await transaction.commit();

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
        },
        session: data.session,
      };
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw new InternalServerErrorException('Signup process failed');
    }
  }

  async signOut(token: string) {
    const { error } = await this.supabaseService.signOut(token);
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Successfully signed out' };
  }

  async resetPassword(email: string) {
    const { error } = await this.supabaseService.resetPassword(email);
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabaseService.updatePassword(newPassword);
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Password updated successfully' };
  }

  async refreshSession() {
    const { data, error } = await this.supabaseService.refreshSession();
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      session: data.session,
    };
  }

  private mapUserResponse(user: User, session: Session | null) {
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || Role.EMPLOYEE,
      },
      session,
    };
  }
}
