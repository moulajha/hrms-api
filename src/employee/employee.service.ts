import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { EmployeeQueryService } from './services/employee-query.service';
import { EmployeeCommandService } from './services/employee-command.service';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly queryService: EmployeeQueryService,
    private readonly commandService: EmployeeCommandService,
  ) {}

  // Query Methods
  async findAll(query: QueryEmployeeDto) {
    return this.queryService.findAll(query);
  }

  async findOne(id: string) {
    return this.queryService.findOne(id);
  }

  // Command Methods
  async create(createEmployeeDto: CreateEmployeeDto) {
    return this.commandService.create(createEmployeeDto);
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.commandService.update(id, updateEmployeeDto);
  }

  async remove(id: string) {
    return this.commandService.remove(id);
  }
}
