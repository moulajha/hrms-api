import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Technical department responsible for product development' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-parent-department' })
  @IsUUID()
  @IsOptional()
  parentDepartmentId?: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'uuid-of-department-head' })
  @IsUUID()
  @IsOptional()
  departmentHeadId?: string;
}
