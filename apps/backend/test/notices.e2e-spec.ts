import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Notice } from './../src/notices/entities/notice.entity';

describe('NoticesController (e2e)', () => {
  let app: INestApplication<App>;
  let adminKey: string;
  let noticeRepository: Repository<Notice>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    adminKey = app.get(ConfigService).get<string>('ADMIN_API_KEY')!;
    noticeRepository = app.get(getRepositoryToken(Notice));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /notices/:id', () => {
    let noticeId: number;

    beforeEach(async () => {
      const notice = await noticeRepository.save(
        noticeRepository.create({
          title: 'e2e 원본 제목',
          content: 'e2e 원본 내용',
        }),
      );
      noticeId = notice.id;
    });

    afterEach(async () => {
      await noticeRepository.delete(noticeId);
    });

    it('관리자 키 없이 호출하면 401을 반환한다', () => {
      return request(app.getHttpServer())
        .patch(`/notices/${noticeId}`)
        .send({ title: '수정된 제목' })
        .expect(401);
    });

    it('존재하지 않는 id면 404를 반환한다', () => {
      return request(app.getHttpServer())
        .patch('/notices/999999')
        .set('x-admin-key', adminKey)
        .send({ title: '수정된 제목' })
        .expect(404);
    });

    it('정상 호출 시 200과 수정된 내용을 반환한다', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notices/${noticeId}`)
        .set('x-admin-key', adminKey)
        .send({ title: '수정된 제목' })
        .expect(200);

      const body = res.body as { title: string; content: string };
      expect(body.title).toBe('수정된 제목');
      expect(body.content).toBe('e2e 원본 내용');
    });
  });

  describe('DELETE /notices/:id', () => {
    let noticeId: number;

    beforeEach(async () => {
      const notice = await noticeRepository.save(
        noticeRepository.create({
          title: 'e2e 삭제 대상',
          content: 'e2e 원본 내용',
        }),
      );
      noticeId = notice.id;
    });

    afterEach(async () => {
      await noticeRepository.delete(noticeId);
    });

    it('관리자 키 없이 호출하면 401을 반환한다', () => {
      return request(app.getHttpServer())
        .delete(`/notices/${noticeId}`)
        .expect(401);
    });

    it('존재하지 않는 id면 404를 반환한다', () => {
      return request(app.getHttpServer())
        .delete('/notices/999999')
        .set('x-admin-key', adminKey)
        .expect(404);
    });

    it('정상 호출 시 200을 반환하고 실제로 삭제된다', async () => {
      await request(app.getHttpServer())
        .delete(`/notices/${noticeId}`)
        .set('x-admin-key', adminKey)
        .expect(200);

      const found = await noticeRepository.findOne({
        where: { id: noticeId },
      });
      expect(found).toBeNull();
    });
  });
});
