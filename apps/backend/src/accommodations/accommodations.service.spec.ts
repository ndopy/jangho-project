import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { AccommodationsService } from './accommodations.service';
import { Accommodation } from './entities/accommodation.entity';

describe('AccommodationsService', () => {
  let service: AccommodationsService;
  let repository: MockRepository<Accommodation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccommodationsService,
        {
          provide: getRepositoryToken(Accommodation),
          useValue: createMockRepository<Accommodation>(),
        },
      ],
    }).compile();

    service = module.get(AccommodationsService);
    repository = module.get(getRepositoryToken(Accommodation));
  });

  it('숙박시설을 생성해 저장한다', async () => {
    const dto = { name: '스테이바다70 펜션', type: 'pension' };
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

  it('존재하는 id로 조회하면 해당 숙박시설을 반환한다', async () => {
    const accommodation = { id: 1, name: '스테이바다70 펜션' };
    repository.findOne!.mockResolvedValue(accommodation);

    const result = await service.findOne(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(accommodation);
  });

  it('존재하지 않는 id로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
