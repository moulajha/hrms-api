import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CommonModule } from '../common/common.module';
import {
  EmployeeBaseService,
  EmployeeQueryService,
  EmployeeCommandService,
  EmployeeTypeBaseService,
  EmployeeTypeQueryService,
  EmployeeTypeCommandService,
  EmployeeCodeService,
} from './services';

@Module({
  imports: [CommonModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeBaseService,
    EmployeeQueryService,
    EmployeeCommandService,
    EmployeeTypeBaseService,
    EmployeeTypeQueryService,
    EmployeeTypeCommandService,
    EmployeeCodeService,
  ],
  exports: [
    EmployeeService,
    EmployeeTypeQueryService,
    EmployeeTypeCommandService,
    EmployeeCodeService,
  ]
})
export class EmployeeModule {}
