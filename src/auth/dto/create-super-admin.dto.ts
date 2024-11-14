import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsUUID } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Super admin email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongP@ss123',
    description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special char)',
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID where the super admin will be created',
  })
  @IsUUID()
  organizationId: string;
}
