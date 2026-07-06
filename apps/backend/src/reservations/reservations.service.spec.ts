import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { Reservation } from './entities/reservation.entity';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let repository: MockRepository<Reservation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: createMockRepository<Reservation>(),
        },
      ],
    }).compile();

    service = module.get(ReservationsService);
    repository = module.get(getRepositoryToken(Reservation));
  });

  it('예약 신청을 생성해 저장한다', async () => {
    const dto = {
      itemType: 'experience' as const,
      itemId: 1,
      itemName: '조개 캐기 체험',
      desiredDate: '2026-08-01',
      peopleCount: 4,
      applicantName: '홍길동',
      applicantPhone: '010-1234-5678',
    };
    const created = { id: 1, ...dto };

    repository.create!.mockReturnValue(created);
    repository.save!.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });
});
