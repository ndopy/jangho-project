import { Module } from '@nestjs/common';
import { TidesService } from './tides.service';
import { TidesController } from './tides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tide } from './entities/tide.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tide])],
  controllers: [TidesController],
  providers: [TidesService],
})
export class TidesModule {}
