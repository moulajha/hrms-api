import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-11-10T18:30:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' }
      }
    }
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('info')
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'hrms-api' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        monitoring: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true }
          }
        },
        logging: {
          type: 'object',
          properties: {
            level: { type: 'string', example: 'info' },
            console: { type: 'boolean', example: true },
            file: { type: 'boolean', example: true }
          }
        },
        api: {
          type: 'object',
          properties: {
            timeout: { type: 'number', example: 5000 }
          }
        }
      }
    }
  })
  getInfo() {
    return this.appService.getInfo();
  }

  @Get()
  @ApiOperation({ summary: 'Get API root information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Root endpoint information',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'HRMS API is running' },
        docs: { type: 'string', example: '/api/docs' },
        health: { type: 'string', example: '/health' },
        info: { type: 'string', example: '/info' }
      }
    }
  })
  root() {
    return {
      message: 'HRMS API is running',
      docs: '/api/docs',
      health: '/health',
      info: '/info',
    };
  }
}
