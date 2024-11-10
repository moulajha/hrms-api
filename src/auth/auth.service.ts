import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../common/services/supabase.service';
import { AuthError, User, Session } from '@supabase/supabase-js';

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

    const [roles, permissions] = await Promise.all([
      this.supabaseService.getUserRoles(data.user.id),
      this.supabaseService.getUserPermissions(data.user.id),
    ]);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        roles,
        permissions,
      },
      session: data.session,
    };
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.signUp(email, password);
    
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
      },
      session: data.session,
    };
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

  private mapUserResponse(user: User, session: Session | null, roles: string[] = [], permissions: string[] = []) {
    return {
      user: {
        id: user.id,
        email: user.email,
        roles,
        permissions,
      },
      session,
    };
  }
}
