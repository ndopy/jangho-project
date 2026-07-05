import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MudflatForecast } from './entities/mudflat-forecast.entity';

@Injectable()
export class MudflatForecastService {
  constructor(
    @InjectRepository(MudflatForecast)
    private mudflatForecastRepository: Repository<MudflatForecast>,
  ) {}

  async findAll(): Promise<MudflatForecast[]> {
    return this.mudflatForecastRepository.find({ order: { date: 'ASC' } });
  }

  async findOne(date: string): Promise<MudflatForecast> {
    const forecast = await this.mudflatForecastRepository.findOne({
      where: { date },
    });

    if (!forecast) {
      throw new NotFoundException(`${date}의 갯벌체험지수를 찾을 수 없습니다.`);
    }

    return forecast;
  }

  // 외부 API 동기화 스크립트(src/sync-mudflat.ts) 전용: 날짜 기준 upsert
  async upsertByDate(
    date: string,
    data: Partial<MudflatForecast>,
  ): Promise<MudflatForecast> {
    const existing = await this.mudflatForecastRepository.findOne({
      where: { date },
    });

    if (existing) {
      return this.mudflatForecastRepository.save(
        this.mudflatForecastRepository.merge(existing, data),
      );
    }

    return this.mudflatForecastRepository.save(
      this.mudflatForecastRepository.create({ date, ...data }),
    );
  }
}
