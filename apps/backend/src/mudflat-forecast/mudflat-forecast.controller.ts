import { Controller, Get, Param } from '@nestjs/common';
import { MudflatForecastService } from './mudflat-forecast.service';

@Controller('mudflat-forecast')
export class MudflatForecastController {
  constructor(
    private readonly mudflatForecastService: MudflatForecastService,
  ) {}

  @Get()
  findAll() {
    return this.mudflatForecastService.findAll();
  }

  @Get(':date')
  findOne(@Param('date') date: string) {
    return this.mudflatForecastService.findOne(date);
  }
}
