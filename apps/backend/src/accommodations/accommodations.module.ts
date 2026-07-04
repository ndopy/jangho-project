import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccommodationsService } from './accommodations.service';
import { AccommodationsController } from './accommodations.controller';
import { Accommodation } from './entities/accommodation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation])],
  controllers: [AccommodationsController],
  providers: [AccommodationsService],
})
export class AccommodationsModule {}
