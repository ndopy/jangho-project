import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @UseGuards(AdminKeyGuard)
  @Post()
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticesService.create(createNoticeDto);
  }

  @Get()
  findAll() {
    return this.noticesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  @UseGuards(AdminKeyGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @UseGuards(AdminKeyGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.remove(id);
  }
}
