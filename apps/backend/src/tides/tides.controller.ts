import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TidesService } from './tides.service';
import { CreateTideDto } from './dto/create-tide.dto';
import { FindTidesQueryDto } from './dto/find-tides-query.dto';

@Controller('tides')
export class TidesController {
  constructor(private readonly tidesService: TidesService) {}

  @Post()
  create(@Body() createTideDto: CreateTideDto) {
    return this.tidesService.create(createTideDto);
  }

  @Get()
  findAll(@Query() query: FindTidesQueryDto) {
    return this.tidesService.findAll(query);
  }

  @Get(':date')
  findOne(@Param('date') date: string) {
    return this.tidesService.findOne(date);
  }
}
