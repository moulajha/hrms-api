import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
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
});
