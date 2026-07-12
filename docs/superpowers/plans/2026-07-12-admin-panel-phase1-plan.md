# 관리자 패널 1단계 (인증 + 예약 신청 조회) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마을 관리자가 비밀번호로 로그인해서 `/admin/reservations`에서 예약 신청 목록·상세를 읽기 전용으로 조회할 수 있게 한다.

**Architecture:** 기존 `apps/frontend`(Next.js App Router) 안에 `/admin` 라우트를 추가하고, `jose`로 서명한 JWT를 HttpOnly 쿠키에 담아 세션을 유지한다. `apps/backend`의 `reservations` 모듈에 `GET /reservations`, `GET /reservations/:id`를 추가하고 새 `AdminKeyGuard`로 보호한다. 프런트 서버가 `x-admin-key` 헤더로 백엔드를 호출하는 서비스 간 인증과, 사람이 브라우저에서 로그인하는 세션 인증은 완전히 분리된 두 시크릿을 쓴다.

**Tech Stack:** NestJS 11 + TypeORM 0.3 (백엔드), Next.js 16 App Router + React 19 (프런트엔드), `jose`(신규 추가) for JWT.

**Spec:** `docs/superpowers/specs/2026-07-12-admin-panel-phase1-design.md` (다이어그램 포함, 커밋됨)

## Global Constraints

- 의존성 설치는 항상 저장소 루트에서 워크스페이스 플래그로 실행한다: `npm install <pkg> --workspace=frontend`. `apps/frontend`나 `apps/backend` 폴더 안에서 개별적으로 `npm install`을 실행하지 않는다.
- 백엔드를 실행하기 전 Postgres가 떠 있어야 한다: 저장소 루트에서 `docker compose up -d`.
- 코드 스타일은 기존 파일들과 동일하게 싱글 쿼트(Prettier singleQuote)를 따른다.
- Next.js 16에서는 `cookies()`, `params`가 모두 비동기(Promise)다 — 항상 `await`로 받는다 (기존 `app/notices/[id]/page.tsx`, `app/experiences/[id]/page.tsx`가 이미 `params: Promise<{ id: string }>` 패턴을 쓰고 있음, 그대로 따를 것).
- 시크릿 3개는 서로 다른 목적이며 절대 섞어 쓰지 않는다: `ADMIN_PASSWORD`(프런트 전용, 사람이 로그인 폼에 입력) / `ADMIN_API_KEY`(백엔드·프런트 공유, 서비스 간 `x-admin-key` 헤더) / `SESSION_SECRET`(프런트 전용, 로그인 세션 JWT 서명).
- `AdminKeyGuard`는 어떤 모듈의 `providers` 배열에도 등록하지 않는다. NestJS는 `@UseGuards(클래스참조)`를 클래스 참조로 넘기면 DI 컨테이너가 자동으로 인스턴스화하고, `ConfigService`는 `AppModule`에 `ConfigModule.forRoot({ isGlobal: true })`로 이미 전역 등록돼 있어 별도 등록 없이 주입된다.
- `redirect()`를 내부에서 호출하는 Server Action은 클라이언트에서 `try/catch`로 감싸 호출하지 않는다 — `redirect()`는 내부적으로 특수 에러를 던지는데, `catch` 블록이 이를 삼켜버리면 리다이렉트가 깨진다. 이 계획에서 `logoutAdmin`은 네이티브 `<form action={fn}>`으로만 호출한다(안전). `loginAdmin`은 내부에서 `redirect()`를 호출하지 않고 `{ error?: string }`를 반환하며, 성공 시 이동은 클라이언트 컴포넌트가 `router.push()`로 처리한다.
- 프런트엔드는 자동 테스트 프레임워크가 없다(기존 프로젝트 상태 그대로). 프런트엔드 태스크의 "테스트" 단계는 `npx tsc --noEmit` 타입 체크 + `npm run dev`로 띄운 개발 서버에서의 수동 확인으로 대체한다.

---

### Task 1: 백엔드 — `AdminKeyGuard` 생성

**Files:**
- Create: `apps/backend/src/common/guards/admin-key.guard.ts`
- Test: `apps/backend/src/common/guards/admin-key.guard.spec.ts`

**Interfaces:**
- Produces: `AdminKeyGuard` 클래스 (`CanActivate` 구현, 생성자가 `ConfigService`를 주입받음). 이후 Task 3에서 `@UseGuards(AdminKeyGuard)`로 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/backend/src/common/guards/admin-key.guard.spec.ts`:

```typescript
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminKeyGuard } from './admin-key.guard';

function createContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminKeyGuard', () => {
  function createGuard(expectedKey: string | undefined) {
    const configService = {
      get: jest.fn().mockReturnValue(expectedKey),
    } as unknown as ConfigService;

    return new AdminKeyGuard(configService);
  }

  it('x-admin-key 헤더가 ADMIN_API_KEY와 일치하면 통과시킨다', () => {
    const guard = createGuard('secret-key');

    const result = guard.canActivate(
      createContext({ 'x-admin-key': 'secret-key' }),
    );

    expect(result).toBe(true);
  });

  it('x-admin-key 헤더가 ADMIN_API_KEY와 다르면 예외를 던진다', () => {
    const guard = createGuard('secret-key');

    expect(() =>
      guard.canActivate(createContext({ 'x-admin-key': 'wrong-key' })),
    ).toThrow(UnauthorizedException);
  });

  it('x-admin-key 헤더가 없으면 예외를 던진다', () => {
    const guard = createGuard('secret-key');

    expect(() => guard.canActivate(createContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('서버에 ADMIN_API_KEY가 설정되어 있지 않으면 무조건 예외를 던진다', () => {
    const guard = createGuard(undefined);

    expect(() =>
      guard.canActivate(createContext({ 'x-admin-key': 'anything' })),
    ).toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run (저장소 루트에서): `npx jest --config apps/backend/package.json admin-key.guard.spec.ts`
Expected: FAIL — `Cannot find module './admin-key.guard'`

- [ ] **Step 3: 최소 구현 작성**

`apps/backend/src/common/guards/admin-key.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-admin-key'];
    const expectedKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!expectedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('관리자 인증이 필요합니다.');
    }

    return true;
  }
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npx jest --config apps/backend/package.json admin-key.guard.spec.ts`
Expected: PASS (테스트 4개 모두)

- [ ] **Step 5: 커밋**

```bash
git add apps/backend/src/common/guards/admin-key.guard.ts apps/backend/src/common/guards/admin-key.guard.spec.ts
git commit -m "feat(backend): 관리자 API 키 검증 Guard 추가"
```

---

### Task 2: 백엔드 — `ReservationsService`에 `findAll`/`findOne` 추가

**Files:**
- Modify: `apps/backend/src/reservations/reservations.service.ts`
- Modify: `apps/backend/src/reservations/reservations.service.spec.ts`

**Interfaces:**
- Consumes: 없음 (기존 `Reservation` 엔티티, `Repository<Reservation>`만 사용)
- Produces: `ReservationsService.findAll(): Promise<Reservation[]>`, `ReservationsService.findOne(id: number): Promise<Reservation>` (없으면 `NotFoundException`). Task 3의 컨트롤러가 이 두 메서드를 호출.

- [ ] **Step 1: 실패하는 테스트 추가**

`apps/backend/src/reservations/reservations.service.spec.ts` 맨 아래(기존 `it('예약 신청을 생성해 저장한다', ...)` 블록 뒤, `});` 앞)에 추가:

```typescript
  it('예약 신청 목록을 최신순으로 조회한다', async () => {
    const reservations = [
      { id: 2, applicantName: '김철수' },
      { id: 1, applicantName: '홍길동' },
    ];
    repository.find!.mockResolvedValue(reservations);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(reservations);
  });

  it('id로 예약 신청 하나를 조회한다', async () => {
    const reservation = { id: 1, applicantName: '홍길동' };
    repository.findOne!.mockResolvedValue(reservation);

    const result = await service.findOne(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(reservation);
  });

  it('존재하지 않는 id로 조회하면 NotFoundException을 던진다', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
```

파일 상단 import에 `NotFoundException` 추가:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  createMockRepository,
  MockRepository,
} from '../common/testing/mock-repository';
import { Reservation } from './entities/reservation.entity';
import { ReservationsService } from './reservations.service';
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npx jest --config apps/backend/package.json reservations.service.spec.ts`
Expected: FAIL — `service.findAll is not a function`

- [ ] **Step 3: 최소 구현 작성**

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
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npx jest --config apps/backend/package.json reservations.service.spec.ts`
Expected: PASS (테스트 4개 모두)

- [ ] **Step 5: 커밋**

```bash
git add apps/backend/src/reservations/reservations.service.ts apps/backend/src/reservations/reservations.service.spec.ts
git commit -m "feat(backend): 예약 신청 목록·상세 조회 서비스 메서드 추가"
```

---

### Task 3: 백엔드 — 컨트롤러에 GET 엔드포인트 연결 + 수동 검증

**Files:**
- Modify: `apps/backend/src/reservations/reservations.controller.ts`
- Modify: `apps/backend/.env` (커밋 안 되는 파일, `ADMIN_API_KEY` 추가)

**Interfaces:**
- Consumes: `AdminKeyGuard`(Task 1), `ReservationsService.findAll`/`findOne`(Task 2)
- Produces: `GET /reservations`(가드 적용), `GET /reservations/:id`(가드 적용). Task 8의 프런트 `lib/api.ts`가 이 두 엔드포인트를 호출.

- [ ] **Step 1: 컨트롤러에 엔드포인트 추가**

`apps/backend/src/reservations/reservations.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
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
}
```

- [ ] **Step 2: `apps/backend/.env`에 `ADMIN_API_KEY` 추가**

`apps/backend/.env` 파일 맨 아래에 한 줄 추가 (로컬 개발용 예시 값, 실제로는 아무 문자열이나 사용 가능):

```
ADMIN_API_KEY=local-dev-admin-key-please-change
```

- [ ] **Step 3: 저장소 루트에서 Postgres 기동 확인**

Run: `docker compose up -d`
Expected: `db` 컨테이너가 `Up` 또는 이미 실행 중이라는 출력

- [ ] **Step 4: 백엔드 개발 서버 실행**

Run (백그라운드로): `npm run start:dev --workspace=backend`
Expected: 콘솔에 `Nest application successfully started` 출력, 포트 4000에서 대기

- [ ] **Step 5: 인증 없이 호출하면 거부되는지 확인**

Run: `curl -i http://localhost:4000/reservations`
Expected: HTTP 상태 코드 `401`

- [ ] **Step 6: 잘못된 키로 호출하면 거부되는지 확인**

Run: `curl -i -H "x-admin-key: wrong-key" http://localhost:4000/reservations`
Expected: HTTP 상태 코드 `401`

- [ ] **Step 7: 올바른 키로 호출하면 통과하는지 확인**

Run: `curl -i -H "x-admin-key: local-dev-admin-key-please-change" http://localhost:4000/reservations`
Expected: HTTP 상태 코드 `200`, 본문은 JSON 배열(`[]` 또는 기존 신청 데이터)

- [ ] **Step 8: 존재하지 않는 id 조회 시 404 확인**

Run: `curl -i -H "x-admin-key: local-dev-admin-key-please-change" http://localhost:4000/reservations/999999`
Expected: HTTP 상태 코드 `404`

- [ ] **Step 9: 기존 유닛 테스트 전체가 여전히 통과하는지 확인**

Run: `npm run test --workspace=backend`
Expected: 모든 테스트 스위트 PASS

- [ ] **Step 10: 커밋**

`.env`는 gitignore 대상이라 커밋되지 않는다 — 컨트롤러 변경분만 커밋:

```bash
git add apps/backend/src/reservations/reservations.controller.ts
git commit -m "feat(backend): 예약 신청 목록·상세 조회 API를 AdminKeyGuard로 보호해 추가"
```

---

### Task 4: 프런트엔드 — `jose` 설치 + `lib/session.ts` (세션 토큰 발급/검증)

**Files:**
- Modify: `apps/frontend/package.json` (의존성 추가, `npm install`로 자동 반영)
- Create: `apps/frontend/lib/session.ts`
- Create: `apps/frontend/.env.local` (커밋 안 되는 파일)

**Interfaces:**
- Produces: `SESSION_COOKIE_NAME: string`, `SESSION_DURATION_SECONDS: number`, `createSessionToken(): Promise<string>`, `verifySessionToken(token: string): Promise<boolean>`. Task 5(`lib/actions.ts`)와 Task 7(`middleware.ts`)이 이 4개를 가져다 씀.

- [ ] **Step 1: `jose` 설치**

Run (저장소 루트에서): `npm install jose --workspace=frontend`
Expected: `apps/frontend/package.json`의 `dependencies`에 `"jose"` 추가됨

- [ ] **Step 2: `apps/frontend/.env.local` 생성**

새 파일 `apps/frontend/.env.local` (로컬 개발용 예시 값 — 실제 값은 자유롭게 바꿔도 됨. `ADMIN_API_KEY`는 Task 3에서 `apps/backend/.env`에 넣은 값과 반드시 동일해야 함):

```
ADMIN_PASSWORD=local-dev-password
ADMIN_API_KEY=local-dev-admin-key-please-change
SESSION_SECRET=local-dev-session-secret-please-change-and-make-it-long
```

- [ ] **Step 3: `lib/session.ts` 작성**

`apps/frontend/lib/session.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'admin_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7일

function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.');
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSessionSecretKey());
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: 타입 체크로 검증**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음 (session.ts 관련 타입 에러가 없어야 함 — 이 시점엔 아직 아무도 session.ts를 안 쓰므로 unused export 경고는 나지 않음)

- [ ] **Step 5: 커밋**

`.env.local`은 gitignore 대상이라 커밋되지 않는다 — `package.json`/`package-lock.json`, `session.ts`만 커밋:

```bash
git add apps/frontend/package.json package-lock.json apps/frontend/lib/session.ts
git commit -m "feat(frontend): jose 기반 관리자 세션 토큰 발급/검증 유틸 추가"
```

---

### Task 5: 프런트엔드 — `lib/actions.ts`에 `loginAdmin`/`logoutAdmin` 추가

**Files:**
- Modify: `apps/frontend/lib/actions.ts`

**Interfaces:**
- Consumes: `lib/session.ts`의 `SESSION_COOKIE_NAME`, `SESSION_DURATION_SECONDS`, `createSessionToken` (Task 4)
- Produces: `loginAdmin(formData: FormData): Promise<{ error?: string }>`, `logoutAdmin(): Promise<void>`. Task 6의 로그인 폼과 Task 9의 로그아웃 버튼이 각각 사용.

- [ ] **Step 1: `lib/actions.ts`에 추가**

`apps/frontend/lib/actions.ts` 전체를 다음으로 교체:

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createReservation, type CreateReservationInput } from '@/lib/api';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/session';

export async function submitReservation(input: CreateReservationInput) {
  const reservation = await createReservation(input);

  return { id: reservation.id };
}

export async function loginAdmin(
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get('password');

  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return { error: '비밀번호가 틀렸습니다.' };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });

  return {};
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}
```

- [ ] **Step 2: 타입 체크로 검증**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/frontend/lib/actions.ts
git commit -m "feat(frontend): 관리자 로그인/로그아웃 Server Action 추가"
```

---

### Task 6: 프런트엔드 — 로그인 페이지 (`/admin/login`) + 수동 검증

**Files:**
- Create: `apps/frontend/components/admin-login-form.tsx`
- Create: `apps/frontend/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `loginAdmin`(Task 5)
- Produces: `/admin/login` 라우트, `AdminLoginForm` 컴포넌트

- [ ] **Step 1: 로그인 폼 컴포넌트 작성**

`apps/frontend/components/admin-login-form.tsx` (기존 `components/reservation-form.tsx`와 동일하게 `useState` + `onSubmit` 패턴을 따름):

```typescript
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { loginAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginAdmin(formData);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push('/admin/reservations');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? '확인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: 로그인 페이지 작성**

`apps/frontend/app/admin/login/page.tsx`:

```typescript
import { AdminLoginForm } from '@/components/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        예약 신청 내역을 확인하려면 비밀번호를 입력하세요.
      </p>
      <AdminLoginForm />
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 4: 개발 서버에서 수동 확인**

Run (백그라운드로): `npm run dev --workspace=frontend`

브라우저에서 `http://localhost:3000/admin/login` 접속:
1. 틀린 비밀번호 입력 후 로그인 클릭 → "비밀번호가 틀렸습니다." 문구가 폼 아래 표시되는지 확인
2. Task 4에서 `.env.local`에 설정한 `ADMIN_PASSWORD` 값(`local-dev-password`)을 입력 후 로그인 클릭 → `/admin/reservations`로 이동 시도(이 시점엔 해당 페이지가 아직 없으므로 404가 떠도 정상 — 리다이렉트 자체가 일어났는지만 확인)
3. 브라우저 개발자도구 → Application → Cookies에서 `admin_session` 쿠키가 생성되어 있는지 확인 (HttpOnly 표시 확인)

- [ ] **Step 5: 커밋**

```bash
git add apps/frontend/components/admin-login-form.tsx apps/frontend/app/admin/login/page.tsx
git commit -m "feat(frontend): 관리자 로그인 페이지 추가"
```

---

### Task 7: 프런트엔드 — `middleware.ts` (라우트 보호) + 수동 검증

**Files:**
- Create: `apps/frontend/middleware.ts`

**Interfaces:**
- Consumes: `lib/session.ts`의 `SESSION_COOKIE_NAME`, `verifySessionToken`(Task 4)
- Produces: `/admin/*`(로그인 페이지 제외) 요청을 가로채는 미들웨어

- [ ] **Step 1: `middleware.ts` 작성**

`apps/frontend/middleware.ts` (프로젝트 루트, `app/`과 같은 레벨):

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 3: 개발 서버 재시작 후 보호되지 않은 상태에서 리다이렉트 확인**

Run: `npm run dev --workspace=frontend` (Task 6에서 띄운 서버가 있으면 재시작 — middleware.ts는 새로 추가된 파일이라 재시작 필요)

브라우저 시크릿 창(쿠키 없는 상태)에서 `http://localhost:3000/admin/reservations` 접속:
Expected: 자동으로 `/admin/login`으로 리다이렉트됨 (아직 실제 페이지는 없지만 URL이 `/admin/login`으로 바뀌는지 확인)

- [ ] **Step 4: 로그인 후 통과 확인**

같은 창에서 `/admin/login`으로 이동해 Task 6과 동일하게 로그인 → `/admin/reservations`로 이동 시도:
Expected: `/admin/login`으로 다시 튕기지 않고 404 페이지가 뜸 (미들웨어를 통과했다는 뜻 — 페이지 자체는 Task 9에서 만듦)

- [ ] **Step 5: 커밋**

```bash
git add apps/frontend/middleware.ts
git commit -m "feat(frontend): 관리자 라우트를 보호하는 middleware 추가"
```

---

### Task 8: 프런트엔드 — `lib/api.ts`에 예약 신청 조회 함수 추가

**Files:**
- Modify: `apps/frontend/lib/api.ts`

**Interfaces:**
- Consumes: 백엔드 `GET /reservations`, `GET /reservations/:id` (Task 3, `x-admin-key` 헤더 필요)
- Produces: `getReservations(): Promise<Reservation[]>`, `getReservationById(id: number): Promise<Reservation | null>`. Task 9(목록)와 Task 10(상세)이 사용.

- [ ] **Step 1: `apiGetAdmin`/`apiGetAdminOrNull` 헬퍼와 조회 함수 추가**

`apps/frontend/lib/api.ts`에서 기존 `apiGetOrNull` 함수 바로 아래(114번째 줄, `}` 다음)에 추가:

```typescript
function adminHeaders(): HeadersInit {
  return { 'x-admin-key': process.env.ADMIN_API_KEY ?? '' };
}

async function apiGetAdmin<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: adminHeaders(),
  });

  if (!res.ok) {
    throw new Error(`관리자 API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiGetAdminOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: adminHeaders(),
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`관리자 API 요청 실패: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}
```

그리고 파일 맨 아래(`getMudflatForecastByDate` 함수 뒤)에 추가:

```typescript
export function getReservations() {
  return apiGetAdmin<Reservation[]>('/reservations');
}

export function getReservationById(id: number) {
  return apiGetAdminOrNull<Reservation>(`/reservations/${id}`);
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/frontend/lib/api.ts
git commit -m "feat(frontend): 관리자용 예약 신청 조회 API 함수 추가"
```

---

### Task 9: 프런트엔드 — 예약 신청 목록 페이지 + 로그아웃 버튼 + `/admin` 리다이렉트

**Files:**
- Create: `apps/frontend/components/admin-logout-button.tsx`
- Create: `apps/frontend/app/admin/reservations/page.tsx`
- Create: `apps/frontend/app/admin/page.tsx`

**Interfaces:**
- Consumes: `getReservations`(Task 8), `logoutAdmin`(Task 5)
- Produces: `/admin`(→`/admin/reservations` 리다이렉트), `/admin/reservations`(목록), `AdminLogoutButton` 컴포넌트

- [ ] **Step 1: 로그아웃 버튼 작성**

`apps/frontend/components/admin-logout-button.tsx` (서버 컴포넌트 — 네이티브 form action으로 `logoutAdmin`을 직접 호출하므로 클라이언트 JS나 `'use client'`가 필요 없음):

```typescript
import { logoutAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';

export function AdminLogoutButton() {
  return (
    <form action={logoutAdmin}>
      <Button type="submit" variant="outline" size="sm">
        로그아웃
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: 목록 페이지 작성**

`apps/frontend/app/admin/reservations/page.tsx` (기존 `app/notices/page.tsx`의 목록 패턴을 따름):

```typescript
import Link from 'next/link';

import { AdminLogoutButton } from '@/components/admin-logout-button';
import { getReservations } from '@/lib/api';

export default async function AdminReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예약 신청 목록</h1>
        <AdminLogoutButton />
      </div>

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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `/admin` 인덱스 리다이렉트 작성**

`apps/frontend/app/admin/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/reservations');
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 5: 개발 서버에서 수동 확인**

먼저 예약 신청이 최소 1건 있어야 목록을 눈으로 확인할 수 있음 — 없다면 기존 공개 폼으로 하나 등록: 브라우저에서 아무 체험/숙박 상세 페이지 → 예약 신청 폼 제출.

Task 3에서 백엔드가 이미 떠 있고, Task 7에서 로그인된 상태라면:
1. `http://localhost:3000/admin` 접속 → 자동으로 `/admin/reservations`로 이동하는지 확인
2. 방금 등록한 신청이 목록에 최신순으로 보이는지 확인 (날짜/체험·숙박명/신청자명/연락처)
3. "로그아웃" 버튼 클릭 → `/admin/login`으로 이동하는지 확인
4. 로그아웃 후 다시 `/admin/reservations`로 직접 접속 → `/admin/login`으로 리다이렉트되는지 확인 (Task 7의 미들웨어가 쿠키 삭제를 인식하는지 재확인)

- [ ] **Step 6: 커밋**

```bash
git add apps/frontend/components/admin-logout-button.tsx apps/frontend/app/admin/reservations/page.tsx apps/frontend/app/admin/page.tsx
git commit -m "feat(frontend): 예약 신청 목록 페이지와 로그아웃 버튼 추가"
```

---

### Task 10: 프런트엔드 — 예약 신청 상세 페이지 + 404 처리 + 수동 검증

**Files:**
- Create: `apps/frontend/app/admin/reservations/[id]/page.tsx`

**Interfaces:**
- Consumes: `getReservationById`(Task 8)
- Produces: `/admin/reservations/[id]` 라우트

- [ ] **Step 1: 상세 페이지 작성**

`apps/frontend/app/admin/reservations/[id]/page.tsx` (기존 `app/notices/[id]/page.tsx`의 `notFound()` 패턴을 따름):

```typescript
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

      <h1 className="mt-3 text-2xl font-bold">{reservation.itemName}</h1>

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

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 3: 개발 서버에서 수동 확인**

로그인된 상태에서:
1. `/admin/reservations` 목록에서 행 하나 클릭 → 상세 페이지로 이동, 희망일자/인원/신청자/연락처/신청일/요청사항이 모두 보이는지 확인
2. 존재하지 않는 id로 직접 접속 (예: `http://localhost:3000/admin/reservations/999999`) → 404 페이지가 뜨는지 확인
3. 로그아웃 후 상세 페이지 URL로 직접 접속 → `/admin/login`으로 리다이렉트되는지 확인

- [ ] **Step 4: 전체 회귀 확인**

Run: `npm run test --workspace=backend`
Expected: 모든 테스트 스위트 PASS (Task 1~3에서 추가한 것 포함)

Run: `npx tsc --noEmit -p apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add apps/frontend/app/admin/reservations/[id]/page.tsx
git commit -m "feat(frontend): 예약 신청 상세 페이지 추가"
```

---

## 완료 후 확인

- `docs/superpowers/specs/2026-07-12-admin-panel-phase1-design.md`의 "사용자 시나리오" 11단계를 처음부터 끝까지 브라우저로 직접 따라가며 재확인
- `PROGRESS.md`의 "예약 목록을 확인할 관리자 패널" 항목을 체크하고, 2단계(상태 변경 + 쓰기 API 보호)·3단계(콘텐츠 CRUD)가 아직 남아있음을 명시
