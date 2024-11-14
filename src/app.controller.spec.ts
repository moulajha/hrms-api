import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'app.name':
            return 'hrms-api';
          case 'app.version':
            return '1.0.0';
          case 'app.nodeEnv':
            return 'test';
          case 'app.monitoring.enabled':
            return true;
          case 'app.logging.level':
            return 'info';
          case 'app.logging.enableConsole':
            return true;
          case 'app.logging.enableFile':
            return false;
          case 'app.api.timeout':
            return 5000;
          default:
            return undefined;
        }
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return API root information', () => {
      const result = appController.root();
      expect(result).toEqual({
        message: 'HRMS API is running',
        docs: '/api/docs',
        health: '/health',
        info: '/info',
      });
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = appController.getHealth();
      expect(result).toEqual({
        status: 'ok',
        timestamp: mockDate.toISOString(),
        version: '1.0.0',
        environment: 'test',
      });

      jest.restoreAllMocks();
    });
  });

  describe('getInfo', () => {
    it('should return application information', () => {
      const result = appController.getInfo();
      expect(result).toEqual({
        name: 'hrms-api',
        version: '1.0.0',
        environment: 'test',
        monitoring: {
          enabled: true,
        },
        logging: {
          level: 'info',
          console: true,
          file: false,
        },
        api: {
          timeout: 5000,
        },
      });
    });
  });
});
