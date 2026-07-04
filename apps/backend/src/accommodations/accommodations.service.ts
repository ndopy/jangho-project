import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { Accommodation } from './entities/accommodation.entity';

@Injectable()
export class AccommodationsService {
  constructor(
    @InjectRepository(Accommodation)
    private accommodationsRepository: Repository<Accommodation>,
  ) {}

  async create(
    createAccommodationDto: CreateAccommodationDto,
  ): Promise<Accommodation> {
    const newAccommodation = this.accommodationsRepository.create(
      createAccommodationDto,
    );

    return await this.accommodationsRepository.save(newAccommodation);
  }

  async findAll(): Promise<Accommodation[]> {
    return this.accommodationsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Accommodation> {
    const accommodation = await this.accommodationsRepository.findOne({
      where: { id },
    });

    if (!accommodation) {
      throw new NotFoundException(`숙박시설(id: ${id})을 찾을 수 없습니다.`);
    }

    return accommodation;
  }
}
