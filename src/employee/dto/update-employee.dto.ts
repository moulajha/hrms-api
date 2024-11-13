import { IsString, IsEmail, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from './create-employee.dto';

export class UpdateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  @IsOptional()
  officialEmail?: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  joinDate?: string;

  @ApiProperty({ example: 'uuid-of-employee-type' })
  @IsUUID()
  @IsOptional()
  employeeTypeId?: string;

  @ApiProperty({ example: 'uuid-of-status' })
  @IsUUID()
  @IsOptional()
  statusId?: string;
}
