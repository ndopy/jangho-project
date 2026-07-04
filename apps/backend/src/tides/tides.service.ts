import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateTideDto } from './dto/create-tide.dto';
import { FindTidesQueryDto } from './dto/find-tides-query.dto';
import { Tide } from './entities/tide.entity';

@Injectable()
export class TidesService {
  constructor(
    @InjectRepository(Tide)
    private tidesRepository: Repository<Tide>,
  ) {}

  async create(createTideDto: CreateTideDto): Promise<Tide> {
    const newTide = this.tidesRepository.create(createTideDto);

    return await this.tidesRepository.save(newTide);
  }

  async findAll(query: FindTidesQueryDto): Promise<Tide[]> {
    const { from, to } = query;

    return this.tidesRepository.find({
      where: from && to ? { date: Between(from, to) } : {},
      order: { date: 'ASC' },
    });
  }

  async findOne(date: string): Promise<Tide> {
    const tide = await this.tidesRepository.findOne({ where: { date } });

    if (!tide) {
      throw new NotFoundException(`${date}의 물때 정보를 찾을 수 없습니다.`);
    }

    return tide;
  }
}
