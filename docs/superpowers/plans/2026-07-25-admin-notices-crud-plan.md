# 관리자 패널 3단계 (공지사항 CRUD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 공지사항을 생성·수정·삭제할 수 있는 화면을 만들고, 관리자 화면 섹션(예약 신청/공지사항) 간 이동 탭을 추가한다.

**Architecture:** `Notice` 엔티티는 그대로 두고, `NoticesService`에 `update`/`remove`를 추가해 새 `PATCH`/`DELETE /notices/:id` 엔드포인트(`AdminKeyGuard` 보호)로 노출한다. 프런트엔드는 목록(`/admin/notices`) + 생성 폼(`/admin/notices/new`) + 수정 폼(`/admin/notices/[id]/edit`) 세 라우트만 만들고, 생성·수정 폼은 하나의 공용 클라이언트 컴포넌트(`NoticeForm`)로 처리한다. 삭제는 목록 페이지에서 `window.confirm()`을 통과해야만 실행되는 별도 버튼 컴포넌트로 처리한다.

**Tech Stack:** NestJS 11 + TypeORM 0.3 + Jest/Supertest(백엔드), Next.js 16 App Router + React 19(프런트엔드)

**Spec:** `docs/superpowers/specs/2026-07-25-admin-notices-crud-design.md` (커밋됨)

## Global Constraints

- 백엔드를 실행하기 전 Postgres가 떠 있어야 한다: 저장소 루트에서 `docker compose up -d`(이미 컨테이너가 있으면 `docker start jangho_postgres`).
- `apps/backend/.env`와 `apps/frontend/.env.local`에 이미 동일한 `ADMIN_API_KEY` 값이 설정되어 있어야 한다. curl로 수동 검증할 때는 `apps/backend/.env`를 직접 열어 그 값을 확인해서 써야 한다 — 이 값을 플랜 문서나 커밋 메시지에 그대로 옮겨 적지 않는다.
- 코드 스타일은 기존 파일과 동일하게 싱글 쿼트(Prettier singleQuote)를 따른다.
- 이번 작업은 `Notice` 엔티티에 컬럼을 추가하지 않으므로 `synchronize: true`로 인한 스키마 변경이 없다.
- `test/notices.e2e-spec.ts`는 실제 로컬 Postgres에 연결해서 실제로 행을 생성·삭제한다. 실행 전 Postgres가 떠 있어야 하고, 각 테스트는 자신이 만든 데이터를 `afterEach`에서 직접 정리해서 로컬 시드 데이터를 훼손하지 않는다.
- 프런트엔드는 자동 테스트 프레임워크가 없다 — 프런트엔드 태스크의 테스트 단계는 `npx tsc --noEmit` 타입 체크 + `npm run dev`로 띄운 개발 서버에서의 수동 확인으로 대체한다.

---

### Task 1: 백엔드 — `NoticesService.update`/`remove` + `PATCH`/`DELETE /notices/:id` + e2e 테스트

**Files:**
- Modify: `apps/backend/src/common/testing/mock-repository.ts`
- Modify: `apps/backend/src/notices/notices.service.ts`
- Modify: `apps/backend/src/notices/notices.controller.ts`
- Modify: `apps/backend/src/notices/notices.service.spec.ts`
- Create: `apps/backend/test/notices.e2e-spec.ts`

**Interfaces:**
- Consumes: `AdminKeyGuard`(`../common/guards/admin-key.guard`) — 기존 것 재사용. `UpdateNoticeDto`(`./dto/update-notice.dto.ts`) — 이미 존재, 그대로 재사용. `createMockRepository`(`../common/testing/mock-repository`) — 이번 태스크 Step 1에서 `remove` mock을 추가한 뒤 재사용.
- Produces: `NoticesService.update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice>`. `NoticesService.remove(id: number): Promise<void>`. `PATCH /notices/:id` 엔드포인트(`AdminKeyGuard` 보호, body: `UpdateNoticeDto`). `DELETE /notices/:id` 엔드포인트(`AdminKeyGuard` 보호). Task 2가 이 두 엔드포인트를 그대로 사용한다.

- [ ] **Step 1: mock repository 헬퍼에 `remove` mock 추가**

`apps/backend/src/common/testing/mock-repository.ts` 전체를 다음으로 교체:

```typescript
import { Repository } from 'typeorm';

export type MockRepository<T extends object = object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

export function createMockRepository<
  T extends object = object,
>(): MockRepository<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };
}
```

- [ ] **Step 2: 실패하는 서비스 테스트 작성**

`apps/backend/src/notices/notices.service.spec.ts`의 마지막 `it(...)` 블록(존재하지 않는 id 조회 테스트) 뒤, `});`(describe 닫는 괄호) 앞에 추가:

```typescript

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
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run (저장소 루트에서): `npx jest --config apps/backend/package.json notices.service.spec.ts`
Expected: FAIL — `service.update is not a function` (또는 `service.remove is not a function`)

- [ ] **Step 4: 서비스에 `update`/`remove` 추가**

`apps/backend/src/notices/notices.service.ts` 전체를 다음으로 교체:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { Notice } from './entities/notice.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticesRepository: Repository<Notice>,
  ) {}

  async create(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    const newNotice = this.noticesRepository.create(createNoticeDto);

    return await this.noticesRepository.save(newNotice);
  }

  async findAll(): Promise<Notice[]> {
    return this.noticesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Notice> {
    const notice = await this.noticesRepository.findOne({ where: { id } });

    if (!notice) {
      throw new NotFoundException(`공지사항(id: ${id})을 찾을 수 없습니다.`);
    }

    return notice;
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);
    const updated = this.noticesRepository.merge(notice, updateNoticeDto);

    return await this.noticesRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const notice = await this.findOne(id);
    await this.noticesRepository.remove(notice);
  }
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npx jest --config apps/backend/package.json notices.service.spec.ts`
Expected: PASS (테스트 8개 모두 — 기존 4개 + 새 4개)

- [ ] **Step 6: 컨트롤러에 `PATCH`/`DELETE` 엔드포인트 추가**

`apps/backend/src/notices/notices.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @UseGuards(AdminKeyGuard)
  @Post()
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticesService.create(createNoticeDto);
  }

  @Get()
  findAll() {
    return this.noticesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.findOne(id);
  }

  @UseGuards(AdminKeyGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @UseGuards(AdminKeyGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticesService.remove(id);
  }
}
```

- [ ] **Step 7: Postgres와 백엔드 개발 서버 기동**

Run: `docker compose up -d` (저장소 루트) — 이미 떠 있으면 `docker start jangho_postgres`
Run (백그라운드로): `npm run start:dev --workspace=backend`
Expected: 콘솔에 `Nest application successfully started` 출력, 라우트 매핑 로그에 `PATCH /notices/:id`, `DELETE /notices/:id`가 보임.

- [ ] **Step 8: curl로 수동 검증**

`apps/backend/.env`를 열어 `ADMIN_API_KEY` 값을 확인한 뒤, 아래 명령의 `<ADMIN_API_KEY>` 자리에 그 값을 넣어 실행. 먼저 목록을 조회해 실제 존재하는 공지 id 하나를 확인:

```bash
curl -s http://localhost:4000/notices
```

목록에서 얻은 id(예: `1`)로 수정 시도:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/notices/1 -H "Content-Type: application/json" -H "x-admin-key: <ADMIN_API_KEY>" -d '{"title":"curl 테스트 제목"}'
```

Expected: `200`

인증 없이 호출하면 거부되는지 확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/notices/1 -H "Content-Type: application/json" -d '{"title":"curl 테스트 제목"}'
```

Expected: `401`

존재하지 않는 id면 404인지 확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/notices/999999 -H "x-admin-key: <ADMIN_API_KEY>"
```

Expected: `404`

- [ ] **Step 9: e2e 테스트 작성**

`apps/backend/test/notices.e2e-spec.ts` 새로 작성:

```typescript
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

      expect(res.body.title).toBe('수정된 제목');
      expect(res.body.content).toBe('e2e 원본 내용');
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
```

- [ ] **Step 10: e2e 테스트 실행해서 통과 확인**

Postgres와 백엔드가 이미 떠 있어도 e2e 테스트는 자체적으로 새 `INestApplication`을 부팅하므로 백엔드 개발 서버(Step 7)는 계속 떠 있어도 무방하다.

Run (저장소 루트에서): `npm run test:e2e --workspace=backend`
Expected: PASS — `app.e2e-spec.ts`와 `notices.e2e-spec.ts` 모두 통과 (총 7개 테스트: 기존 1개 + 새 6개)

- [ ] **Step 11: 전체 유닛 테스트 회귀 확인**

Run: `npm run test --workspace=backend`
Expected: 모든 테스트 스위트 PASS

- [ ] **Step 12: 커밋**

```bash
git add apps/backend/src/common/testing/mock-repository.ts apps/backend/src/notices/notices.service.ts apps/backend/src/notices/notices.controller.ts apps/backend/src/notices/notices.service.spec.ts apps/backend/test/notices.e2e-spec.ts
git commit -m "feat(backend): 공지사항 수정/삭제 API 추가 및 e2e 테스트 도입"
```

---

### Task 2: 프런트엔드 — 목록/생성/수정 화면 + 관리자 내비게이션

**Files:**
- Modify: `apps/frontend/lib/api.ts`
- Modify: `apps/frontend/lib/actions.ts`
- Modify: `apps/frontend/app/admin/reservations/page.tsx`
- Create: `apps/frontend/components/admin-nav.tsx`
- Create: `apps/frontend/components/notice-form.tsx`
- Create: `apps/frontend/components/delete-notice-button.tsx`
- Create: `apps/frontend/app/admin/notices/page.tsx`
- Create: `apps/frontend/app/admin/notices/new/page.tsx`
- Create: `apps/frontend/app/admin/notices/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: Task 1의 `PATCH`/`DELETE /notices/:id`(`x-admin-key` 헤더 필요). 기존 `apiPatchAdmin`/`adminHeaders`/`getNotices`/`getNoticeById`(`lib/api.ts`) 재사용. 기존 `AdminLogoutButton`(`components/admin-logout-button.tsx`), `Button`/`Input`/`Label`/`Textarea`(`components/ui/`) 재사용. `Button`은 Base UI 프리미티브 기반이라 `render` prop으로 다른 엘리먼트(`Link` 등)를 대신 렌더링할 수 있다(`reservation-form.tsx`의 `PopoverTrigger render={<Button .../>}` 사용례와 동일한 방식).
- Produces: `CreateNoticeInput` 타입, `createNotice(input)`/`updateNotice(id, input)`/`deleteNotice(id)`(`lib/api.ts`), `createNoticeAction(input)`/`updateNoticeAction(id, input)`/`deleteNoticeAction(id)`(`lib/actions.ts`), `AdminNav`/`NoticeForm`/`DeleteNoticeButton` 컴포넌트. 이후 체험/숙박 CRUD 단계에서 `AdminNav`에 탭을 추가하고 같은 패턴을 재사용할 예정.

- [ ] **Step 1: `lib/api.ts`에 관리자용 POST/DELETE 헬퍼와 공지사항 CRUD 함수 추가**

`apps/frontend/lib/api.ts`에서 `export type Notice = {`로 시작하는 블록을 찾아 바로 다음에 추가:

```typescript

export type CreateNoticeInput = {
  title: string;
  content: string;
};
```

`function adminHeaders(): HeadersInit {` 함수 바로 다음, `async function apiPatchAdmin` 함수 앞에 추가:

```typescript
async function apiPostAdmin<TInput, TOutput>(
  path: string,
  body: TInput,
): Promise<TOutput> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`관리자 API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<TOutput>;
}

```

`async function apiGetAdminOrNull<T>(path: string): Promise<T | null> {` 함수 전체 뒤(다음 함수 시작 전)에 추가:

```typescript

async function apiDeleteAdmin(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error(`관리자 API 요청 실패: ${path} (${res.status})`);
  }
}
```

파일 맨 끝(기존 `export function updateReservationStatus` 다음)에 추가:

```typescript

export function createNotice(input: CreateNoticeInput) {
  return apiPostAdmin<CreateNoticeInput, Notice>('/notices', input);
}

export function updateNotice(id: number, input: CreateNoticeInput) {
  return apiPatchAdmin<CreateNoticeInput, Notice>(`/notices/${id}`, input);
}

export function deleteNotice(id: number) {
  return apiDeleteAdmin(`/notices/${id}`);
}
```

- [ ] **Step 2: `lib/actions.ts`에 Server Action 추가**

`apps/frontend/lib/actions.ts` 상단 import 블록을 다음으로 교체:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  createNotice,
  createReservation,
  deleteNotice,
  updateNotice,
  updateReservationStatus,
  type CreateNoticeInput,
  type CreateReservationInput,
  type ReservationStatus,
} from '@/lib/api';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/session';
```

파일 맨 끝(기존 `updateReservationStatusAction` 함수 다음)에 추가:

```typescript

export async function createNoticeAction(input: CreateNoticeInput) {
  const notice = await createNotice(input);
  revalidatePath('/admin/notices');

  return { id: notice.id };
}

export async function updateNoticeAction(
  id: number,
  input: CreateNoticeInput,
) {
  await updateNotice(id, input);
  revalidatePath('/admin/notices');
}

export async function deleteNoticeAction(id: number) {
  await deleteNotice(id);
  revalidatePath('/admin/notices');
}
```

- [ ] **Step 3: 관리자 상단 내비게이션 컴포넌트 작성**

`apps/frontend/components/admin-nav.tsx` 새로 작성:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AdminLogoutButton } from '@/components/admin-logout-button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/reservations', label: '예약 신청' },
  { href: '/admin/notices', label: '공지사항' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between">
      <nav className="flex gap-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <AdminLogoutButton />
    </div>
  );
}
```

- [ ] **Step 4: 예약 신청 목록 페이지에서 `AdminNav` 사용하도록 교체**

`apps/frontend/app/admin/reservations/page.tsx` 전체를 다음으로 교체:

```typescript
import Link from 'next/link';

import { AdminNav } from '@/components/admin-nav';
import { ReservationStatusBadge } from '@/components/reservation-status-badge';
import { getReservations } from '@/lib/api';

export default async function AdminReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <AdminNav />

      <h1 className="mt-6 text-2xl font-bold">예약 신청 목록</h1>

      {reservations.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          접수된 예약 신청이 없습니다
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <Link
                href={`/admin/reservations/${reservation.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm transition-colors hover:text-primary"
              >
                <span className="text-muted-foreground">
                  {new Date(reservation.createdAt).toLocaleDateString(
                    'ko-KR',
                  )}
                </span>
                <span className="font-medium">{reservation.itemName}</span>
                <span className="text-muted-foreground">
                  {reservation.applicantName}
                </span>
                <span className="text-muted-foreground">
                  {reservation.applicantPhone}
                </span>
                <ReservationStatusBadge status={reservation.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 공지사항 생성/수정 공용 폼 컴포넌트 작성**

`apps/frontend/components/notice-form.tsx` 새로 작성:

```typescript
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { createNoticeAction, updateNoticeAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function NoticeForm({
  noticeId,
  initialValues,
}: {
  noticeId?: number;
  initialValues?: { title: string; content: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (noticeId) {
        await updateNoticeAction(noticeId, { title, content });
      } else {
        await createNoticeAction({ title, content });
      }
      router.push('/admin/notices');
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          required
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: 삭제 버튼 컴포넌트 작성**

`apps/frontend/components/delete-notice-button.tsx` 새로 작성:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteNoticeAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';

export function DeleteNoticeButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm('삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    await deleteNoticeAction(id);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={deleting}
    >
      삭제
    </Button>
  );
}
```

- [ ] **Step 7: 공지사항 목록(관리자) 페이지 작성**

`apps/frontend/app/admin/notices/page.tsx` 새로 작성:

```typescript
import Link from 'next/link';

import { AdminNav } from '@/components/admin-nav';
import { DeleteNoticeButton } from '@/components/delete-notice-button';
import { Button } from '@/components/ui/button';
import { getNotices } from '@/lib/api';

export default async function AdminNoticesPage() {
  const notices = await getNotices();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <AdminNav />

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <Button render={<Link href="/admin/notices/new">새 공지 작성</Link>} />
      </div>

      {notices.length === 0 ? (
        <p className="mt-6 text-muted-foreground">등록된 공지가 없습니다</p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm"
            >
              <span className="font-medium">{notice.title}</span>
              <span className="text-muted-foreground">
                {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/admin/notices/${notice.id}/edit`}>수정</Link>}
                />
                <DeleteNoticeButton id={notice.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 8: 공지사항 생성 페이지 작성**

`apps/frontend/app/admin/notices/new/page.tsx` 새로 작성:

```typescript
import { AdminNav } from '@/components/admin-nav';
import { NoticeForm } from '@/components/notice-form';

export default function AdminNewNoticePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold">새 공지 작성</h1>
      <div className="mt-6">
        <NoticeForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: 공지사항 수정 페이지 작성**

`apps/frontend/app/admin/notices/[id]/edit/page.tsx` 새로 작성:

```typescript
import { notFound } from 'next/navigation';

import { AdminNav } from '@/components/admin-nav';
import { NoticeForm } from '@/components/notice-form';
import { getNoticeById } from '@/lib/api';

export default async function AdminEditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(Number(id));

  if (!notice) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold">공지사항 수정</h1>
      <div className="mt-6">
        <NoticeForm
          noticeId={notice.id}
          initialValues={{ title: notice.title, content: notice.content }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 10: 타입 체크**

Run: `npx tsc --noEmit --project apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 11: 개발 서버로 수동 확인**

Task 1의 백엔드 서버가 계속 떠 있는 상태에서 실행:

Run (백그라운드로): `npm run dev --workspace=frontend`

`/admin/login`에서 로그인 후 다음을 확인한다.

1. `/admin/reservations`와 `/admin/notices` 양쪽 상단에 "예약 신청 | 공지사항" 탭과 로그아웃 버튼이 동일하게 보이는지, 현재 위치한 섹션의 탭이 강조 색으로 표시되는지 확인한다.
2. `/admin/notices`에서 "새 공지 작성" 클릭 → `/admin/notices/new`에서 제목/내용 입력 후 저장 → `/admin/notices`로 돌아와 방금 작성한 공지가 목록에 보이는지 확인한다.
3. 방금 작성한 공지의 "수정" 클릭 → 기존 제목/내용이 폼에 프리필되어 있는지 확인 → 제목을 바꿔서 저장 → 목록에 바뀐 제목이 반영되는지 확인한다.
4. 방금 작성한 공지의 "삭제" 클릭 → 브라우저 확인창에서 "취소"를 누르면 삭제되지 않는지 확인 → 다시 "삭제" 클릭 후 확인창에서 "확인"을 누르면 목록에서 즉시 사라지는지 확인한다.
5. 필수 필드(제목 또는 내용)를 비운 채 저장을 시도하면 브라우저 기본 유효성 검사(`required`)로 제출이 막히는지 확인한다.

- [ ] **Step 12: 커밋**

```bash
git add apps/frontend/lib/api.ts apps/frontend/lib/actions.ts apps/frontend/app/admin/reservations/page.tsx apps/frontend/components/admin-nav.tsx apps/frontend/components/notice-form.tsx apps/frontend/components/delete-notice-button.tsx apps/frontend/app/admin/notices
git commit -m "feat(frontend): 공지사항 관리자 CRUD 화면과 상단 내비게이션 추가"
```

---

## 완료 후 확인

- `PROGRESS.md`의 "관리자 패널 3단계" 항목을 "공지사항 CRUD는 완료, 체험/숙박 콘텐츠 CRUD는 남은 작업"이라는 내용으로 갱신한다(세 콘텐츠 타입 중 하나만 끝난 상태이므로 항목 전체를 체크 완료로 바꾸지 않는다).
- 체험/숙박 콘텐츠 CRUD는 이번에 확립한 패턴(백엔드 PATCH/DELETE + e2e 테스트, 프런트엔드 목록+생성/수정 폼+삭제 버튼)을 재사용해 별도 스펙으로 진행한다.
