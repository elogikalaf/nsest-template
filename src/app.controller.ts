import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { jwtGaurd } from './auth/gaurd';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @UseGuards(jwtGaurd)
  getHello(): string {
    return this.appService.getHello();
  }
}
