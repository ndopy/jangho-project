import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MudflatForecastService } from './mudflat-forecast.service';
import { MudflatForecastController } from './mudflat-forecast.controller';
import { MudflatForecast } from './entities/mudflat-forecast.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MudflatForecast])],
  controllers: [MudflatForecastController],
  providers: [MudflatForecastService],
  exports: [MudflatForecastService],
})
export class MudflatForecastModule {}
