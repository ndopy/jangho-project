import { Controller, Post, Body } from '@nestjs/common';
import { TidesService } from './tides.service';
import { CreateTideDto } from './dto/create-tide.dto';

@Controller('tides')
export class TidesController {
  constructor(private readonly tidesService: TidesService) {}

  @Post()
  create(@Body() createTideDto: CreateTideDto) {
    return this.tidesService.create(createTideDto);
  }
}
