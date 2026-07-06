import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { MudflatForecast } from './entities/mudflat-forecast.entity';
import { MudflatForecastService } from './mudflat-forecast.service';

describe('MudflatForecastService', () => {
  let service: MudflatForecastService;
  let repository: MockRepository<MudflatForecast>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MudflatForecastService,
        {
          provide: getRepositoryToken(MudflatForecast),
          useValue: createMockRepository<MudflatForecast>(),
        },
      ],
    }).compile();

    service = module.get(MudflatForecastService);
    repository = module.get(getRepositoryToken(MudflatForecast));
  });

  it('날짜 오름차순으로 전체 목록을 조회한다', async () => {
    const list = [{ date: '2026-07-01' }, { date: '2026-07-02' }];
    repository.find!.mockResolvedValue(list);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({ order: { date: 'ASC' } });
    expect(result).toEqual(list);
  });

  it('존재하는 날짜로 조회하면 해당 예보를 반환한다', async () => {
    const forecast = { date: '2026-07-01', totalIndex: '보통' };
    repository.findOne!.mockResolvedValue(forecast);

    const result = await service.findOne('2026-07-01');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { date: '2026-07-01' },
    });
    expect(result).toEqual(forecast);
  });

  it('존재하지 않는 날짜로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne('2026-01-01')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('upsertByDate: 기존 데이터가 있으면 병합해서 저장한다', async () => {
    const existing = { date: '2026-07-01', totalIndex: '보통' };
    const merged = { date: '2026-07-01', totalIndex: '좋음' };

    repository.findOne!.mockResolvedValue(existing);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValue(merged);

    const result = await service.upsertByDate('2026-07-01', {
      totalIndex: '좋음',
    });

    expect(repository.merge).toHaveBeenCalledWith(existing, {
      totalIndex: '좋음',
    });
    expect(repository.save).toHaveBeenCalledWith(merged);
    expect(result).toEqual(merged);
  });

  it('upsertByDate: 기존 데이터가 없으면 새로 생성해서 저장한다', async () => {
    const created = { date: '2026-07-02', totalIndex: '나쁨' };

    repository.findOne!.mockResolvedValue(null);
    repository.create!.mockReturnValue(created);
    repository.save!.mockResolvedValue(created);

    const result = await service.upsertByDate('2026-07-02', {
      totalIndex: '나쁨',
    });

    expect(repository.create).toHaveBeenCalledWith({
      date: '2026-07-02',
      totalIndex: '나쁨',
    });
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });
});
