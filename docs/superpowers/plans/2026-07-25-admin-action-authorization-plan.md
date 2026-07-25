# 관리자 Server Action 인가 검사 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 전용 Server Action 4개(`updateReservationStatusAction`, `createNoticeAction`, `updateNoticeAction`, `deleteNoticeAction`)가 미들웨어와 별개로 자체 세션 검사를 하도록 만든다.

**Architecture:** `apps/frontend/lib/actions.ts`에 비공개 헬퍼 `requireAdminSession()`을 추가하고, 위 4개 액션 각각의 첫 줄에서 호출한다. 세션이 유효하지 않으면 단순 `Error`를 던진다.

**Tech Stack:** Next.js 16 App Router + React 19, `jose`(JWT 검증, `lib/session.ts`에 이미 있음)

**Spec:** `docs/superpowers/specs/2026-07-25-admin-action-authorization-design.md` (커밋됨)

## Global Constraints

- `apps/frontend/.env.local`은 이미 존재하며 `ADMIN_PASSWORD`, `ADMIN_API_KEY`, `SESSION_SECRET`이 채워져 있다. 새로 만들거나 값을 바꾸지 않는다.
- 코드 스타일은 기존 파일과 동일하게 싱글 쿼트(Prettier singleQuote)를 따른다.
- 이 저장소 `apps/frontend/app` 아래에는 `error.tsx`가 전혀 없다(확인됨) — Server Action에서 처리되지 않은 에러가 던져지면 Next.js 전역 기본 에러 화면이 뜨는 것이 현재 동작이며, 이번 작업 범위에서 별도 error boundary를 만들지 않는다.
- 프런트엔드는 자동 테스트 프레임워크가 없다 — 테스트 단계는 `npx tsc --noEmit` 타입 체크 + `npm run dev`로 띄운 개발 서버에서의 수동 확인으로 대체한다.
- `updateReservationStatus`/`createNotice`/`updateNotice`/`deleteNotice`(`lib/api.ts`) 호출은 실제 백엔드 API를 부르므로, 수동 확인 시 Postgres와 백엔드 개발 서버가 떠 있어야 한다: 저장소 루트에서 `docker compose up -d`(이미 컨테이너가 있으면 `docker start jangho_postgres`) → `npm run start:dev --workspace=backend`.

---

### Task 1: `lib/actions.ts`에 `requireAdminSession()` 추가 및 4개 액션에 적용

**Files:**
- Modify: `apps/frontend/lib/actions.ts`

**Interfaces:**
- Consumes: `verifySessionToken`(`@/lib/session`, 이미 존재) — `(token: string) => Promise<boolean>`. `SESSION_COOKIE_NAME`(`@/lib/session`, 이미 존재). `cookies`(`next/headers`, 이미 이 파일에서 import 중).
- Produces: `requireAdminSession(): Promise<void>` — 이 파일 내부에서만 쓰는 비공개 함수(export 안 함). 이후 체험/숙박 관리자 액션이 추가되면 같은 헬퍼를 재사용할 것을 전제로 한다.

- [ ] **Step 1: 현재 파일 확인**

`apps/frontend/lib/actions.ts`를 열어서 아래 "Step 2"의 교체 대상과 실제 파일 내용이 일치하는지 확인한다(다른 작업으로 파일이 바뀌었을 수 있으니 교체 전에 반드시 확인).

- [ ] **Step 2: `requireAdminSession()` 추가 및 4개 액션에 적용**

`apps/frontend/lib/actions.ts` 전체를 다음으로 교체:

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
  verifySessionToken,
} from '@/lib/session';

async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    throw new Error('관리자 인증이 필요합니다.');
  }
}

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

export async function updateReservationStatusAction(
  id: number,
  status: ReservationStatus,
) {
  await requireAdminSession();
  await updateReservationStatus(id, status);
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath('/admin/reservations');
}

export async function createNoticeAction(input: CreateNoticeInput) {
  await requireAdminSession();
  const notice = await createNotice(input);
  revalidatePath('/admin/notices');

  return { id: notice.id };
}

export async function updateNoticeAction(id: number, input: CreateNoticeInput) {
  await requireAdminSession();
  await updateNotice(id, input);
  revalidatePath('/admin/notices');
}

export async function deleteNoticeAction(id: number) {
  await requireAdminSession();
  await deleteNotice(id);
  revalidatePath('/admin/notices');
}
```

`submitReservation`, `loginAdmin`, `logoutAdmin`은 `requireAdminSession()` 호출을 추가하지 않는다(스펙의 "범위 밖" 참고).

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --project apps/frontend/tsconfig.json`
Expected: 에러 없음

- [ ] **Step 4: 린트**

Run: `npm run lint --workspace=frontend`
Expected: 이 파일에서 새로 발생한 에러 없음(기존에 무관하게 있던 경고가 있다면 그대로 둔다)

- [ ] **Step 5: Postgres와 백엔드 개발 서버 기동**

Run: `docker compose up -d` (저장소 루트) — 이미 떠 있으면 `docker start jangho_postgres`
Run (백그라운드로): `npm run start:dev --workspace=backend`
Expected: `Nest application successfully started`

- [ ] **Step 6: 프런트엔드 개발 서버 기동**

Run (백그라운드로): `npm run dev --workspace=frontend`

- [ ] **Step 7: 정상 로그인 상태에서 4개 액션이 기존과 동일하게 동작하는지 수동 확인**

`/admin/login`에서 로그인 후 다음을 확인한다.

1. `/admin/reservations`에서 아무 예약이나 열어 "확인으로 변경"/"보류로 변경" 버튼을 눌러 상태가 바뀌는지 확인한다.
2. `/admin/notices`에서 "새 공지 작성"으로 공지를 하나 만들고, 방금 만든 공지를 수정하고, 삭제까지 정상적으로 되는지 확인한다.

- [ ] **Step 8: 세션 쿠키가 없을 때 4개 액션이 막히는지 수동 확인**

브라우저 개발자 도구(Application/Storage 탭)에서 `admin_session` 쿠키를 삭제한 뒤(페이지는 새로고침하지 않고 그대로 둔다), 이미 열려 있는 `/admin/reservations/[id]` 상세 페이지나 `/admin/notices/new` 폼에서 상태 변경/저장을 시도한다.

Expected: 미들웨어의 페이지 리다이렉트가 아니라 액션 자체에서 에러가 발생해야 한다(정상 동작으로 이어지지 않고 막혀야 한다). 어떤 에러 화면이 뜨는지(Next.js 기본 에러 화면 여부) 확인하고 기록해둔다.

- [ ] **Step 9: 커밋**

```bash
git add apps/frontend/lib/actions.ts
git commit -m "$(cat <<'EOF'
fix(frontend): 관리자 Server Action에 자체 세션 검사 추가

- lib/actions.ts에 requireAdminSession() 비공개 헬퍼 추가
- 예약 상태 변경/공지 생성/수정/삭제 액션 4개에 적용
- 미들웨어 우회 가능성(세션 만료, 액션 직접 호출)에 대한 2차 방어선
EOF
)"
```

---

## 완료 후 확인

- `docs/superpowers/specs/2026-07-25-admin-action-authorization-design.md`에 명시된 범위(4개 액션만 대상, `loginAdmin`/`logoutAdmin`/`submitReservation` 제외)와 실제 구현이 일치하는지 다시 한번 확인한다.
- 이번에 만든 `requireAdminSession()` 패턴은 체험/숙박 콘텐츠 CRUD 관리자 액션이 추가될 때 그대로 재사용한다.
