import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { Notice } from './entities/notice.entity';
import { NoticesService } from './notices.service';

describe('NoticesService', () => {
  let service: NoticesService;
  let repository: MockRepository<Notice>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticesService,
        {
          provide: getRepositoryToken(Notice),
          useValue: createMockRepository<Notice>(),
        },
      ],
    }).compile();

    service = module.get(NoticesService);
    repository = module.get(getRepositoryToken(Notice));
  });

  it('공지사항을 생성해 저장한다', async () => {
    const dto = { title: '공지 제목', content: '공지 내용' };
    const created = { id: 1, ...dto };

    repository.create!.mockReturnValue(created);
    repository.save!.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  it('최신순으로 전체 목록을 조회한다', async () => {
    const list = [{ id: 2 }, { id: 1 }];
    repository.find!.mockResolvedValue(list);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(list);
  });

  it('존재하는 id로 조회하면 해당 공지사항을 반환한다', async () => {
    const notice = { id: 1, title: '공지 제목' };
    repository.findOne!.mockResolvedValue(notice);

    const result = await service.findOne(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(notice);
  });

  it('존재하지 않는 id로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('공지사항을 수정한다', async () => {
    const existing = { id: 1, title: '기존 제목', content: '기존 내용' };
    const dto = { title: '새 제목' };
    const merged = { ...existing, ...dto };
    repository.findOne!.mockResolvedValue(existing);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValue(merged);

    const result = await service.update(1, dto);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.merge).toHaveBeenCalledWith(existing, dto);
    expect(repository.save).toHaveBeenCalledWith(merged);
    expect(result).toEqual(merged);
  });

  it('존재하지 않는 id를 수정하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.update(999, { title: '새 제목' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('공지사항을 삭제한다', async () => {
    const existing = { id: 1, title: '공지 제목' };
    repository.findOne!.mockResolvedValue(existing);
    repository.remove!.mockResolvedValue(existing);

    await service.remove(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.remove).toHaveBeenCalledWith(existing);
  });

  it('존재하지 않는 id를 삭제하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
