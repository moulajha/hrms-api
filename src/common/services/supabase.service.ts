import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient, User, AuthResponse, AuthError, UserResponse } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Role } from '../decorators/roles.decorator';

interface RoleResult {
  roles: {
    name: string;
  };
}

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Client for public operations (used by frontend)
    this.supabase = createClient(
      this.configService.get('app.supabase.url'),
      this.configService.get('app.supabase.anonKey'),
    );

    // Admin client with service role for backend operations
    this.adminClient = createClient(
      this.configService.get('app.supabase.url'),
      this.configService.get('app.supabase.serviceKey'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
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
      const { data: { user }, error } = await this.adminClient.auth.getUser(token);
      
      if (error) {
        return { user: null, error };
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.adminClient
      .from('profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.adminClient
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', userId) as { data: RoleResult[] | null, error: any };

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data?.map(item => item.roles.name) || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.adminClient
        .rpc('get_user_permissions', { p_user_id: userId });

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signUp(email: string, password: string, organizationId: string, role: Role = Role.EMPLOYEE): Promise<AuthResponse> {
    // Create user with public client
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_id: organizationId
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create profile using admin client
      const { error: profileError } = await this.adminClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: organizationId
        });

      if (profileError) throw profileError;

      // Assign default role using admin client
      const { error: roleError } = await this.adminClient
        .rpc('assign_role', {
          p_user_id: authData.user.id,
          p_role_name: role
        });

      if (roleError) throw roleError;
    }

    return { data: authData, error: null };
  }

  async signOut(token: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
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

  async updateProfile(userId: string, data: any) {
    const { error } = await this.adminClient
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
    return { message: 'Profile updated successfully' };
  }

  async getCurrentOrganization(userId: string) {
    const { data, error } = await this.adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.organization_id;
  }

  async assignRole(userId: string, roleName: string) {
    const { error } = await this.adminClient
      .rpc('assign_role', {
        p_user_id: userId,
        p_role_name: roleName
      });

    if (error) throw error;
    return { message: 'Role assigned successfully' };
  }

  // New method to check if an organization exists
  async checkOrganizationExists(organizationId: string): Promise<boolean> {
    const { data, error } = await this.adminClient
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error checking organization existence:', error);
      return false;
    }

    return !!data;
  }

  // Placeholder for transaction management
  async startTransaction() {
    // Supabase does not support transactions directly, so this is a placeholder
    // You may need to handle transactions manually or ensure atomic operations
    return {
      commit: async () => {
        // Commit logic here
      },
      rollback: async () => {
        // Rollback logic here
      }
    };
  }
}
