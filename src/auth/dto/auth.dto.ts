import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class SignUpDto extends SignInDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: {
      id: 'user-uuid',
      email: 'user@example.com',
      roles: ['EMPLOYEE'],
      permissions: ['READ_PROFILE']
    }
  })
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };

  @ApiProperty({
    example: {
      access_token: 'jwt-token',
      token_type: 'bearer',
      expires_in: 3600
    }
  })
  session: any;
}
