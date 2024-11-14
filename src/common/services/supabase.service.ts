import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient, User, AuthResponse, AuthError, UserResponse } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Role } from '../decorators/roles.decorator';

interface RoleData {
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

  getAdminClient(): SupabaseClient {
    return this.adminClient;
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
      // First get the user's organization_id
      const { data: profile, error: profileError } = await this.adminClient
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return [];
      }

      // Then get roles for this user in their organization
      const { data: roleData, error: roleError } = await this.adminClient
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('organization_id', profile.organization_id) as { data: RoleData[] | null, error: any };

      if (roleError) {
        console.error('Error fetching user roles:', roleError);
        return [];
      }

      // Extract and return role names
      return roleData?.map(item => item.roles.name).filter(Boolean) || [];
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

      // Parse the JSONB array response
      if (data) {
        try {
          // If data is already an array, return it
          if (Array.isArray(data)) {
            return data;
          }
          // If data is a string, parse it
          if (typeof data === 'string') {
            return JSON.parse(data);
          }
          // If data is a JSONB object, convert it to array
          if (typeof data === 'object') {
            return Object.values(data);
          }
        } catch (parseError) {
          console.error('Error parsing permissions:', parseError);
        }
      }

      return [];
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

  // Employee-specific methods using adminClient
  async checkExistingEmployee(email: string) {
    try {
      const { data, error } = await this.adminClient
        .from('employees')
        .select('id')
        .eq('official_email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing employee:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in checkExistingEmployee:', error);
      return { data: null, error };
    }
  }

  async getEmployeeTypes(organizationId: string) {
    try {
      const { data, error } = await this.adminClient
        .from('employee_types')
        .select('id, name')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching employee types:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getEmployeeTypes:', error);
      return { data: null, error };
    }
  }

  async verifyEmployeeType(typeId: string, organizationId: string) {
    try {
      console.log(`Verifying employee type - TypeID: ${typeId}, OrgID: ${organizationId}`);
      
      const { data, error } = await this.adminClient
        .from('employee_types')
        .select('*')
        .eq('id', typeId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error verifying employee type:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return { data: null, error };
      }

      if (!data) {
        console.log('No employee type found matching criteria');
      } else {
        console.log('Found employee type:', data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in verifyEmployeeType:', error);
      return { data: null, error };
    }
  }

  async verifyEmployeeStatus(statusId: string, organizationId: string) {
    try {
      const { data, error } = await this.adminClient
        .from('employee_status')
        .select('*')
        .eq('id', statusId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verifying employee status:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in verifyEmployeeStatus:', error);
      return { data: null, error };
    }
  }

  async createEmployee(employeeData: any) {
    try {
      const { data, error } = await this.adminClient
        .from('employees')
        .insert(employeeData)
        .select('*, employee_types(name), employee_status(name)')
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createEmployee:', error);
      return { data: null, error };
    }
  }

  // New methods for remaining CRUD operations
  async getEmployees(organizationId: string, page = 1, limit = 10, searchTerm?: string) {
    try {
      let query = this.adminClient
        .from('employees')
        .select(`
          *,
          employee_types (
            id,
            name
          ),
          employee_status (
            id,
            name
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Add search if provided
      if (searchTerm) {
        query = query.or('first_name.ilike.%' + searchTerm + '%,last_name.ilike.%' + searchTerm + '%,official_email.ilike.%' + searchTerm + '%');
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        return { data: null, error, count: 0 };
      }

      return { data, error: null, count };
    } catch (error) {
      console.error('Error in getEmployees:', error);
      return { data: null, error, count: 0 };
    }
  }

  async getEmployeeById(id: string, organizationId: string) {
    try {
      const { data, error } = await this.adminClient
        .from('employees')
        .select(`
          *,
          employee_types (
            id,
            name
          ),
          employee_status (
            id,
            name
          )
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching employee:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      return { data: null, error };
    }
  }

  async updateEmployee(id: string, organizationId: string, employeeData: any) {
    try {
      const { data, error } = await this.adminClient
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('*, employee_types(name), employee_status(name)')
        .single();

      if (error) {
        console.error('Error updating employee:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return { data: null, error };
    }
  }

  async deleteEmployee(id: string, organizationId: string) {
    try {
      const { error } = await this.adminClient
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error deleting employee:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return { error };
    }
  }

  // New Organization-specific methods
  async getOrganizations(page = 1, limit = 10, searchTerm?: string) {
    try {
      let query = this.adminClient
        .from('organizations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Add search if provided
      if (searchTerm) {
        query = query.or('name.ilike.%' + searchTerm + '%,slug.ilike.%' + searchTerm + '%,email.ilike.%' + searchTerm + '%');
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching organizations:', error);
        return { data: null, error, count: 0 };
      }

      return { data, error: null, count };
    } catch (error) {
      console.error('Error in getOrganizations:', error);
      return { data: null, error, count: 0 };
    }
  }

  async getOrganizationById(id: string) {
    try {
      const { data, error } = await this.adminClient
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organization:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getOrganizationById:', error);
      return { data: null, error };
    }
  }

  async getOrganizationBySlug(slug: string) {
    try {
      const { data, error } = await this.adminClient
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organization by slug:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getOrganizationBySlug:', error);
      return { data: null, error };
    }
  }

  async createOrganization(organizationData: any) {
    try {
      const { data, error } = await this.adminClient
        .from('organizations')
        .insert(organizationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createOrganization:', error);
      return { data: null, error };
    }
  }

  async updateOrganization(id: string, organizationData: any) {
    try {
      const { data, error } = await this.adminClient
        .from('organizations')
        .update(organizationData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateOrganization:', error);
      return { data: null, error };
    }
  }

  async deleteOrganization(id: string) {
    try {
      const { error } = await this.adminClient
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting organization:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteOrganization:', error);
      return { error };
    }
  }

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
