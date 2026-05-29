import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTideDto } from './dto/create-tide.dto';
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
}
