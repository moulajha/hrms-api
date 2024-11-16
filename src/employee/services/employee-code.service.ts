import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmployeeCodeService {
  private readonly logger = new Logger(EmployeeCodeService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async generateEmployeeCode(organizationId: string): Promise<string> {
    try {
      // Get organization details
      const { data: org, error: orgError } = await this.supabaseService.getAdminClient()
        .from('organizations')
        .select('name, slug')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        this.logger.error('Error fetching organization:', orgError);
        throw new InternalServerErrorException('Failed to fetch organization details');
      }

      // Get current count of employees for this organization
      const { count, error: countError } = await this.supabaseService.getAdminClient()
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        this.logger.error('Error counting employees:', countError);
        throw new InternalServerErrorException('Failed to count employees');
      }

      // Generate sequence number
      const nextSequence = (count || 0) + 1;
      
      // Generate employee code using organization slug and sequence
      // Format: ORG-EMP-001
      const employeeCode = `${org.slug.toUpperCase()}-EMP-${String(nextSequence).padStart(3, '0')}`;

      return employeeCode;
    } catch (error) {
      this.logger.error('Error generating employee code:', error);
      throw error;
    }
  }

  async isEmployeeCodeUnique(employeeCode: string, organizationId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabaseService.getAdminClient()
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employee_code', employeeCode)
        .eq('organization_id', organizationId);

      if (error) {
        this.logger.error('Error checking employee code uniqueness:', error);
        throw new InternalServerErrorException('Failed to check employee code uniqueness');
      }

      return count === 0;
    } catch (error) {
      this.logger.error('Error checking employee code uniqueness:', error);
      throw error;
    }
  }
}
