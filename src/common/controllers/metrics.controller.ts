import { Controller, Get, Res } from '@nestjs/common';
import * as promClient from 'prom-client';
import { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  private readonly register: promClient.Registry;

  constructor() {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });
  }

  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', this.register.contentType);
    res.end(await this.register.metrics());
  }
}
