import { IsString, IsEmail, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  officialEmail: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  joinDate: string;

  @ApiProperty({ example: 'uuid-of-employee-type' })
  @IsUUID()
  employeeTypeId: string;

  @ApiProperty({ example: 'uuid-of-status' })
  @IsUUID()
  statusId: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  organizationId: string;
}
