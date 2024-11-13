import { IsString, IsOptional, IsEmail, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  })
  slug: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123 Business Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'GSTIN123456789' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiProperty({ example: 'PAN123456789' })
  @IsString()
  @IsOptional()
  pan?: string;
}
