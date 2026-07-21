# 관리자 패널 2-B (예약 상태 변경) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예약 신청에 `pending`/`confirmed`/`hold` 상태를 추가하고, 관리자가 상세 페이지에서 상태를 바꿀 수 있게 한다. 목록 페이지에는 상태를 배지로만 보여준다.

**Architecture:** `Reservation` 엔티티에 `status` 컬럼을 추가하고, 새 `PATCH /reservations/:id` 엔드포인트(`AdminKeyGuard` 보호)로 상태만 갱신한다. 프런트엔드는 상세 페이지에 네이티브 `<form action={...}>` 버튼 2개(확인/보류)를 추가하고, Server Action이 백엔드를 호출한 뒤 목록·상세 두 경로를 모두 재검증한다.

**Tech Stack:** NestJS 11 + TypeORM 0.3 (백엔드), Next.js 16 App Router + React 19 (프런트엔드)

**Spec:** `docs/superpowers/specs/2026-07-12-admin-reservation-status-design.md` (다이어그램 포함, 커밋됨)

## Global Constraints

- 백엔드를 실행하기 전 Postgres가 떠 있어야 한다: 저장소 루트에서 `docker compose up -d`(이미 컨테이너가 있으면 `docker start jangho_postgres`).
- `apps/backend/.env`와 `apps/frontend/.env.local`에 이미 동일한 `ADMIN_API_KEY` 값이 설정되어 있어야 한다(1단계에서 세팅됨). curl로 수동 검증할 때는 `apps/backend/.env`를 직접 열어 그 값을 확인해서 써야 한다 — 이 값을 플랜 문서나 커밋 메시지에 그대로 옮겨 적지 않는다.
- 코드 스타일은 기존 파일과 동일하게 싱글 쿼트(Prettier singleQuote)를 따른다.
- `synchronize: true`(개발 전용 설정, `apps/backend/src/app.module.ts`)라 백엔드 서버가 재시작되면 새 `status` 컬럼이 자동으로 추가되고 기존 행에는 엔티티의 `default: 'pending'`이 채워진다 — 별도 마이그레이션 불필요.
- 대기(`pending`)로 되돌리는 기능, 취소/거절 상태는 이번 범위에 없다(스펙의 "범위 밖" 참고).
- 프런트엔드는 자동 테스트 프레임워크가 없다 — 프런트엔드 태스크의 테스트 단계는 `npx tsc --noEmit` 타입 체크 + `npm run dev`로 띄운 개발 서버에서의 수동 확인으로 대체한다.

---

### Task 1: 백엔드 — `status` 컬럼 + `PATCH /reservations/:id`

**Files:**
- Modify: `apps/backend/src/reservations/entities/reservation.entity.ts`
- Create: `apps/backend/src/reservations/dto/update-reservation-status.dto.ts`
- Modify: `apps/backend/src/reservations/reservations.service.ts`
- Modify: `apps/backend/src/reservations/reservations.controller.ts`
- Modify: `apps/backend/src/reservations/reservations.service.spec.ts`

**Interfaces:**
- Consumes: `AdminKeyGuard`(`../common/guards/admin-key.guard`) — 기존 것 재사용. `createMockRepository`(`../common/testing/mock-repository`)의 `merge`/`save`/`findOne` mock — 기존 것 재사용.
- Produces: `Reservation.status: 'pending' | 'confirmed' | 'hold'` 필드. `ReservationsService.updateStatus(id: number, status: 'confirmed' | 'hold'): Promise<Reservation>`. `PATCH /reservations/:id` 엔드포인트(`AdminKeyGuard` 보호, body: `{ status: 'confirmed' | 'hold' }`). Task 2가 이 엔드포인트와 `status` 필드를 그대로 사용한다.

- [ ] **Step 1: 엔티티에 `status` 컬럼 추가**

`apps/backend/src/reservations/entities/reservation.entity.ts`의 `message` 컬럼과 `createdAt` 사이에 추가:

```typescript
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'confirmed' | 'hold';
```

- [ ] **Step 2: 실패하는 서비스 테스트 작성**

`apps/backend/src/reservations/reservations.service.spec.ts`의 마지막 `it(...)` 블록(존재하지 않는 id 조회 테스트) 뒤, `});`(describe 닫는 괄호) 앞에 추가:

```typescript

  it('예약 상태를 confirmed로 변경한다', async () => {
    const existing = { id: 1, applicantName: '홍길동', status: 'pending' };
    const merged = { ...existing, status: 'confirmed' };
    repository.findOne!.mockResolvedValue(existing);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValue(merged);

    const result = await service.updateStatus(1, 'confirmed');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.merge).toHaveBeenCalledWith(existing, {
      status: 'confirmed',
    });
    expect(repository.save).toHaveBeenCalledWith(merged);
    expect(result).toEqual(merged);
  });

  it('예약 상태를 hold로 변경한다', async () => {
    const existing = { id: 2, applicantName: '김철수', status: 'confirmed' };
    const merged = { ...existing, status: 'hold' };
    repository.findOne!.mockResolvedValue(existing);
    repository.merge!.mockReturnValue(merged);
    repository.save!.mockResolvedValue(merged);

    const result = await service.updateStatus(2, 'hold');

    expect(result).toEqual(merged);
  });

  it('존재하지 않는 id로 상태를 변경하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.updateStatus(999, 'confirmed')).rejects.toThrow(
      NotFoundException,
    );
  });
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run (저장소 루트에서): `npx jest --config apps/backend/package.json reservations.service.spec.ts`
Expected: FAIL — `service.updateStatus is not a function`

- [ ] **Step 4: DTO 작성**

`apps/backend/src/reservations/dto/update-reservation-status.dto.ts`:

```typescript
import { IsIn } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsIn(['confirmed', 'hold'])
  status: 'confirmed' | 'hold';
}
```

- [ ] **Step 5: 서비스에 `updateStatus` 추가**

`apps/backend/src/reservations/reservations.service.ts` 전체를 다음으로 교체:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const newReservation =
      this.reservationsRepository.create(createReservationDto);

    return await this.reservationsRepository.save(newReservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`예약 신청(id: ${id})을 찾을 수 없습니다.`);
    }

    return reservation;
  }

  async updateStatus(
    id: number,
    status: 'confirmed' | 'hold',
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    const updated = this.reservationsRepository.merge(reservation, {
      status,
    });

    return await this.reservationsRepository.save(updated);
  }
}
```

- [ ] **Step 6: 테스트 실행해서 통과 확인**

Run: `npx jest --config apps/backend/package.json reservations.service.spec.ts`
Expected: PASS (테스트 7개 모두 — 기존 4개 + 새 3개)

- [ ] **Step 7: 컨트롤러에 `PATCH` 엔드포인트 추가**

`apps/backend/src/reservations/reservations.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @UseGuards(AdminKeyGuard)
  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @UseGuards(AdminKeyGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(AdminKeyGuard)
  @Patch(':id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservationStatusDto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(
      id,
      updateReservationStatusDto.status,
    );
  }
}
```

- [ ] **Step 8: Postgres와 백엔드 개발 서버 기동**

Run: `docker compose up -d` (저장소 루트) — 이미 떠 있으면 `docker start jangho_postgres`
Run (백그라운드로): `npm run start:dev --workspace=backend`
Expected: 콘솔에 `Nest application successfully started` 출력. 기동 로그에 `status` 컬럼이 포함된 `reservations` 테이블 관련 스키마 변경 쿼리가 보이면 정상(신규 컬럼 자동 추가).

- [ ] **Step 9: curl로 수동 검증**

`apps/backend/.env`를 열어 `ADMIN_API_KEY` 값을 확인한 뒤, 아래 명령의 `<ADMIN_API_KEY>` 자리에 그 값을 넣어 실행. 먼저 목록을 조회해 실제 존재하는 예약 id 하나를 확인:

```bash
curl -s http://localhost:4000/reservations -H "x-admin-key: <ADMIN_API_KEY>"
```

목록에서 얻은 id(예: `1`)로 상태 변경 시도:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/reservations/1 -H "Content-Type: application/json" -H "x-admin-key: <ADMIN_API_KEY>" -d '{"status":"confirmed"}'
```

Expected: `200`, 응답 바디의 `status`가 `"confirmed"`

인증 없이 호출하면 거부되는지 확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/reservations/1 -H "Content-Type: application/json" -d '{"status":"confirmed"}'
```

Expected: `401`

잘못된 status 값이면 거부되는지 확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/reservations/1 -H "Content-Type: application/json" -H "x-admin-key: <ADMIN_API_KEY>" -d '{"status":"cancelled"}'
```

Expected: `400`

존재하지 않는 id면 404인지 확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/reservations/999999 -H "Content-Type: application/json" -H "x-admin-key: <ADMIN_API_KEY>" -d '{"status":"confirmed"}'
```

Expected: `404`

- [ ] **Step 10: 전체 유닛 테스트 회귀 확인**

Run: `npm run test --workspace=backend`
Expected: 모든 테스트 스위트 PASS

- [ ] **Step 11: 커밋**

```bash
git add apps/backend/src/reservations/entities/reservation.entity.ts apps/backend/src/reservations/dto/update-reservation-status.dto.ts apps/backend/src/reservations/reservations.service.ts apps/backend/src/reservations/reservations.controller.ts apps/backend/src/reservations/reservations.service.spec.ts
git commit -m "feat(backend): 예약 상태 변경 PATCH API 추가"
```

---

### Task 2: 프런트엔드 — 상태 배지 + 변경 버튼

**Files:**
- Modify: `apps/frontend/lib/api.ts`
- Modify: `apps/frontend/lib/actions.ts`
- Create: `apps/frontend/components/reservation-status-badge.tsx`
- Modify: `apps/frontend/app/admin/reservations/[id]/page.tsx`
- Modify: `apps/frontend/app/admin/reservations/page.tsx`

**Interfaces:**
- Consumes: Task 1의 `PATCH /reservations/:id`(body `{ status: 'confirmed' | 'hold' }`, `x-admin-key` 헤더 필요). 기존 `apiGetAdmin`/`adminHeaders`(`lib/api.ts`) 재사용. 기존 `AdminLogoutButton`(`components/admin-logout-button.tsx`)과 동일한 네이티브 `<form action={...}>` + `bind` 패턴.
- Produces: `ReservationStatus` 타입, `updateReservationStatus(id, status)`(`lib/api.ts`), `updateReservationStatusAction(id, status)`(`lib/actions.ts`), `ReservationStatusBadge` 컴포넌트. 이후 3단계(콘텐츠 CRUD) 작업과는 직접 연관 없음.

- [ ] **Step 1: `lib/api.ts`에 상태 타입과 PATCH 헬퍼 추가**

`apps/frontend/lib/api.ts`에서 `export type Reservation = CreateReservationInput & {`로 시작하는 블록을 찾아 다음으로 교체:

```typescript
export type ReservationStatus = 'pending' | 'confirmed' | 'hold';

export type Reservation = CreateReservationInput & {
  id: number;
  status: ReservationStatus;
  createdAt: string;
};
```

`function adminHeaders(): HeadersInit {` 함수 바로 다음, `async function apiGetAdmin` 함수 앞에 추가:

```typescript
async function apiPatchAdmin<TInput, TOutput>(
  path: string,
  body: TInput,
): Promise<TOutput> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`관리자 API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<TOutput>;
}
```

파일 맨 끝(`export function getReservationById` 다음)에 추가:

```typescript

export function updateReservationStatus(
  id: number,
  status: ReservationStatus,
) {
  return apiPatchAdmin<{ status: ReservationStatus }, Reservation>(
    `/reservations/${id}`,
    { status },
  );
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
  createReservation,
  updateReservationStatus,
  type CreateReservationInput,
  type ReservationStatus,
} from '@/lib/api';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/session';
```

파일 맨 끝(`logoutAdmin` 함수 다음)에 추가:

```typescript

export async function updateReservationStatusAction(
  id: number,
  status: ReservationStatus,
) {
  await updateReservationStatus(id, status);
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath('/admin/reservations');
}
```

- [ ] **Step 3: 상태 배지 컴포넌트 작성**

`apps/frontend/components/reservation-status-badge.tsx`:

```typescript
import type { ReservationStatus } from '@/lib/api';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: '대기',
  confirmed: '확인',
  hold: '보류',
};

const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  confirmed:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  hold: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
};

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
```

- [ ] **Step 4: 상세 페이지에 배지와 변경 버튼 추가**

`apps/frontend/app/admin/reservations/[id]/page.tsx` 전체를 다음으로 교체:

```typescript
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservationStatusBadge } from '@/components/reservation-status-badge';
import { Button } from '@/components/ui/button';
import { updateReservationStatusAction } from '@/lib/actions';
import { getReservationById } from '@/lib/api';

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservationById(Number(id));

  if (!reservation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link
        href="/admin/reservations"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 예약 신청 목록
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{reservation.itemName}</h1>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <div className="mt-4 flex gap-2">
        <form
          action={updateReservationStatusAction.bind(
            null,
            reservation.id,
            'confirmed',
          )}
        >
          <Button type="submit" size="sm">
            확인으로 변경
          </Button>
        </form>
        <form
          action={updateReservationStatusAction.bind(
            null,
            reservation.id,
            'hold',
          )}
        >
          <Button type="submit" variant="outline" size="sm">
            보류로 변경
          </Button>
        </form>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">희망 날짜</dt>
          <dd>{reservation.desiredDate}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">인원</dt>
          <dd>{reservation.peopleCount}명</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">신청자</dt>
          <dd>{reservation.applicantName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">연락처</dt>
          <dd>{reservation.applicantPhone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">신청일</dt>
          <dd>
            {new Date(reservation.createdAt).toLocaleDateString('ko-KR')}
          </dd>
        </div>
        {reservation.message && (
          <div>
            <dt className="text-muted-foreground">요청사항</dt>
            <dd className="mt-1 whitespace-pre-line">
              {reservation.message}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
```

- [ ] **Step 5: 목록 페이지에 배지 추가**

`apps/frontend/app/admin/reservations/page.tsx`에서 `import { getReservations } from '@/lib/api';` 줄을 다음으로 교체:

```typescript
import { ReservationStatusBadge } from '@/components/reservation-status-badge';
import { getReservations } from '@/lib/api';
```

`<span className="text-muted-foreground">{reservation.applicantPhone}</span>`으로 끝나는 줄 바로 다음, `</Link>` 앞에 추가:

```typescript
                <ReservationStatusBadge status={reservation.status} />
```

- [ ] **Step 6: 타입 체크**

Run: `npx tsc --noEmit --project apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 7: 개발 서버로 수동 확인**

Task 1의 백엔드 서버가 계속 떠 있는 상태에서 실행:

Run (백그라운드로): `npm run dev --workspace=frontend`
`/admin/login`에서 로그인 후 `/admin/reservations`로 이동해 다음을 확인:

1. 목록의 각 행 끝에 상태 배지(처음엔 대부분 회색 "대기", Task 1 curl 테스트에서 상태를 바꾼 예약은 초록 "확인")가 보이는지
2. 아무 예약이나 클릭해 상세 페이지로 이동, 현재 상태 배지와 "확인으로 변경"/"보류로 변경" 버튼 2개가 보이는지
3. "보류로 변경" 클릭 → 배지가 주황 "보류"로 바뀌고 페이지가 그대로 상세 페이지에 머무는지
4. "예약 신청 목록"으로 돌아가 방금 바꾼 예약의 배지도 "보류"로 반영되어 있는지(재검증 확인)
5. 같은 예약에서 "확인으로 변경"을 두 번 연속 클릭해도 에러 없이 "확인" 상태로 유지되는지(멱등성)

- [ ] **Step 8: 커밋**

```bash
git add apps/frontend/lib/api.ts apps/frontend/lib/actions.ts apps/frontend/components/reservation-status-badge.tsx apps/frontend/app/admin/reservations/[id]/page.tsx apps/frontend/app/admin/reservations/page.tsx
git commit -m "feat(frontend): 예약 상태 변경 버튼과 배지 추가"
```

---

## 완료 후 확인

- `PROGRESS.md`의 관리자 패널 로드맵에서 "관리자 패널 2단계" 항목을 완료로 체크하고, 3단계(콘텐츠 CRUD 관리자 화면)가 다음 남은 작업임을 명시한다.
