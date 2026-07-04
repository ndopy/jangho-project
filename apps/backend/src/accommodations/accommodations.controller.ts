import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationsService.create(createAccommodationDto);
  }

  @Get()
  findAll() {
    return this.accommodationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accommodationsService.findOne(id);
  }
}
