import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { Role } from '../../common/decorators/roles.decorator';

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    enum: Role,
    default: Role.EMPLOYEE,
    description: 'User role',
  })
  @IsOptional()
  role?: Role;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;
}

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: {
      id: 'user-uuid',
      email: 'user@example.com',
      role: Role.EMPLOYEE,
    },
  })
  user: {
    id: string;
    email: string;
    role: Role;
  };

  @ApiProperty({
    example: {
      access_token: 'eyJhbGciOiJIUzI1...',
      token_type: 'bearer',
      expires_in: 3600,
    },
  })
  session: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}
