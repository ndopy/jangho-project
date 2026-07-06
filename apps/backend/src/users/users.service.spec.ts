import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('회원 정보를 생성해 저장한다', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      phone: '010-1234-5678',
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
