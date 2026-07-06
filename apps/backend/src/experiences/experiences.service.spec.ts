import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { ExperiencesService } from './experiences.service';
import { ExperienceProgram } from './entities/experience-program.entity';

describe('ExperiencesService', () => {
  let service: ExperiencesService;
  let repository: MockRepository<ExperienceProgram>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperiencesService,
        {
          provide: getRepositoryToken(ExperienceProgram),
          useValue: createMockRepository<ExperienceProgram>(),
        },
      ],
    }).compile();

    service = module.get(ExperiencesService);
    repository = module.get(getRepositoryToken(ExperienceProgram));
  });

  it('체험 프로그램을 생성해 저장한다', async () => {
    const dto = { name: '조개 캐기 체험', price: 10000 };
    const created = { id: 1, ...dto };

    repository.create!.mockReturnValue(created);
    repository.save!.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  it('id 오름차순으로 전체 목록을 조회한다', async () => {
    const list = [{ id: 1 }, { id: 2 }];
    repository.find!.mockResolvedValue(list);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
    expect(result).toEqual(list);
  });

  it('존재하는 id로 조회하면 해당 체험을 반환한다', async () => {
    const experience = { id: 1, name: '조개 캐기 체험' };
    repository.findOne!.mockResolvedValue(experience);

    const result = await service.findOne(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(experience);
  });

  it('존재하지 않는 id로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
