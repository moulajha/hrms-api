import { IsString, IsOptional, IsEmail, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class CreateInitialOrganizationDto extends CreateOrganizationDto {
  @ApiProperty({ 
    example: 'StrongP@ssw0rd123',
    description: 'Password for the super admin account. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  admin_password: string;
}
