import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { ExperienceProgram } from './entities/experience-program.entity';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(ExperienceProgram)
    private experiencesRepository: Repository<ExperienceProgram>,
  ) {}

  async create(
    createExperienceDto: CreateExperienceDto,
  ): Promise<ExperienceProgram> {
    const newExperience =
      this.experiencesRepository.create(createExperienceDto);

    return await this.experiencesRepository.save(newExperience);
  }

  async findAll(): Promise<ExperienceProgram[]> {
    return this.experiencesRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<ExperienceProgram> {
    const experience = await this.experiencesRepository.findOne({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundException(
        `체험 프로그램(id: ${id})을 찾을 수 없습니다.`,
      );
    }

    return experience;
  }
}
