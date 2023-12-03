import { Controller, Post, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('generate')
  generate() {
    return this.appService.generate();
  }

  @Get('timestamp-data')
  list() {
    return this.appService.list();
  }
}
