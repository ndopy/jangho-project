import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between } from 'typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { Tide } from './entities/tide.entity';
import { TidesService } from './tides.service';

describe('TidesService', () => {
  let service: TidesService;
  let repository: MockRepository<Tide>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TidesService,
        {
          provide: getRepositoryToken(Tide),
          useValue: createMockRepository<Tide>(),
        },
      ],
    }).compile();

    service = module.get(TidesService);
    repository = module.get(getRepositoryToken(Tide));
  });

  it('물때 정보를 생성해 저장한다', async () => {
    const dto = { date: '2026-07-06' };
    const created = { id: 1, ...dto };

    repository.create!.mockReturnValue(created);
    repository.save!.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  it('from/to 없이 조회하면 조건 없이 전체를 조회한다', async () => {
    const list = [{ date: '2026-07-01' }];
    repository.find!.mockResolvedValue(list);

    const result = await service.findAll({});

    expect(repository.find).toHaveBeenCalledWith({
      where: {},
      order: { date: 'ASC' },
    });
    expect(result).toEqual(list);
  });

  it('from/to가 있으면 날짜 범위로 조회한다', async () => {
    const list = [{ date: '2026-07-02' }];
    repository.find!.mockResolvedValue(list);

    const result = await service.findAll({
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(repository.find).toHaveBeenCalledWith({
      where: { date: Between('2026-07-01', '2026-07-31') },
      order: { date: 'ASC' },
    });
    expect(result).toEqual(list);
  });

  it('존재하는 날짜로 조회하면 해당 물때 정보를 반환한다', async () => {
    const tide = { date: '2026-07-06' };
    repository.findOne!.mockResolvedValue(tide);

    const result = await service.findOne('2026-07-06');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { date: '2026-07-06' },
    });
    expect(result).toEqual(tide);
  });

  it('존재하지 않는 날짜로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne('2026-01-01')).rejects.toThrow(
      NotFoundException,
    );
  });
});
