import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient, User, AuthResponse, AuthTokenResponse, AuthError, UserResponse } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('app.supabase.url'),
      this.configService.get('app.supabase.anonKey'),
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyToken(token: string): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      // Create a new client with the token
      const supabase = createClient(
        this.configService.get('app.supabase.url'),
        this.configService.get('app.supabase.anonKey'),
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { user: null, error };
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data?.map(item => item.role) || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }

      return data?.map(item => item.permission) || [];
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  async getTenantId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching tenant ID:', error);
        return null;
      }

      return data?.tenant_id || null;
    } catch (error) {
      console.error('Error in getTenantId:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    return await this.supabase.auth.signUp({
      email,
      password,
    });
  }

  async signOut(token: string): Promise<{ error: AuthError | null }> {
    try {
      // Create a new client with the token
      const supabase = createClient(
        this.configService.get('app.supabase.url'),
        this.configService.get('app.supabase.anonKey'),
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  async updatePassword(newPassword: string): Promise<UserResponse> {
    return await this.supabase.auth.updateUser({
      password: newPassword,
    });
  }

  async refreshSession(): Promise<AuthResponse> {
    return await this.supabase.auth.refreshSession();
  }

  async updateUserProfile(userId: string, data: any) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return profile;
  }
}
