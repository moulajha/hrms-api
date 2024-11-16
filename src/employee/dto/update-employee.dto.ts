import { IsString, IsEmail, IsEnum, IsDateString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from './create-employee.dto';

export class UpdateEmployeeDto {
  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@company.com', required: false })
  @IsEmail()
  @IsOptional()
  officialEmail?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  joinDate?: string;

  @ApiProperty({ example: 'ACME_ET_001', description: 'Employee Type ID in format ORG_ET_XXX', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9]+_ET_\d{3}$/, {
    message: 'employeeTypeId must be in format ORG_ET_XXX where XXX is a number'
  })
  employeeTypeId?: string;

  @ApiProperty({ example: 'uuid-of-status', required: false })
  @IsString()
  @IsOptional()
  statusId?: string;
}
