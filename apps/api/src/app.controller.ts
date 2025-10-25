import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-swipe')
  async testSaveSwipe(): Promise<string> {
    return this.appService.testSaveSwipe();
  }
  @Get('test-swipe2')
  async getTestSwipe2(): Promise<string> {
    return this.appService.getTestSwipe();
  }
}
