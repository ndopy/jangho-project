# 관리자 패널 1단계: 인증 + 예약 신청 조회 (읽기 전용)

## 배경 / 문제

예약 신청(`reservations` 모듈)은 `POST /reservations`만 존재해서 신청은 쌓이지만 확인할 화면이 없다. 현재는 DB를 직접 조회해야 한다. 관리자 패널 전체 범위(예약 관리 + 체험/숙박/공지 콘텐츠 관리)는 한 번에 설계·구현하기엔 크므로 3단계로 나눈다.

- **1단계 (이 문서)**: 인증 + 예약 신청 목록/상세 조회 (읽기 전용)
- 2단계: 예약 상태 변경(확인/보류) + 기존 쓰기 API(`POST /experiences` 등) 보호
- 3단계: 체험/숙박/공지 콘텐츠 CRUD 관리 UI

## 프로젝트 구조 결정

관리자 패널은 별도 프로젝트로 분리하지 않고 기존 Next.js 프런트엔드(`apps/frontend`) 안에 `/admin` 라우트 세그먼트로 구현한다. 미니 프로젝트 규모(단일 관리자, 배포처 미정)에서 별도 프로젝트는 인증·배포·의존성 오버헤드만 늘어난다. 관리자 인증 요구가 크게 달라지거나(SSO 등) 배포 주기를 분리하고 싶어지면 그때 분리한다.

## 사용자 / 범위

- 관리자는 마을 운영자 1인만 사용한다 (다중 계정 불필요).
- 1단계는 예약 신청 **조회만** 한다. 상태 변경, 콘텐츠 관리는 2·3단계로 미룬다.

## 인증 아키텍처

두 개의 분리된 시크릿을 사용한다.

- `ADMIN_PASSWORD` (프런트엔드 서버 전용 env) — 관리자가 로그인 폼에 입력하는 값
- `ADMIN_API_KEY` (백엔드 · 프런트엔드 공유 env, 동일 값) — 프런트 서버가 백엔드의 보호된 엔드포인트를 호출할 때 붙이는 서비스 간 시크릿 (`x-admin-key` 헤더)
- `SESSION_SECRET` (프런트엔드 서버 전용 env) — 로그인 세션 쿠키(JWT) 서명용

백엔드는 로그인/비밀번호를 전혀 모른다. 오직 고정된 `x-admin-key` 값만 검사한다. 브라우저는 여전히 백엔드를 직접 호출하지 않고 항상 프런트 서버를 거친다(기존 CORS 회피 원칙 유지).

**흐름**

1. `/admin/login`에서 비밀번호 입력 → Server Action이 `ADMIN_PASSWORD`와 비교
2. 일치하면 `jose`로 서명한 JWT를 HttpOnly 쿠키로 발급 (7일 만료, `SameSite=Lax`, 프로덕션에서 `Secure`)
   - JWT란: "관리자로 로그인함, ~까지 유효"라는 내용을 담은 통행증. 누구나 내용을 읽을 순 있지만 서버만 아는 비밀키로 봉인(서명)해둬서 내용을 조작하면 바로 들통남
   - `jose`란: 이 봉인을 찍고 확인하는 라이브러리. 더 유명한 `jsonwebtoken` 대신 쓰는 이유는 `middleware.ts`가 일반 Node.js 서버가 아니라 더 가벼운 실행 환경(Edge 런타임)에서 도는데, `jsonwebtoken`은 거기서 동작하지 않기 때문
3. `middleware.ts`가 `/admin/*`(로그인 페이지 제외) 요청마다 쿠키 서명을 검증. 없거나 만료/위조면 `/admin/login`으로 리다이렉트
4. 로그아웃 버튼 → 쿠키 삭제 Server Action

## 백엔드 설계 (`apps/backend`)

`reservations` 모듈에 추가:

- `GET /reservations` — 목록, `createdAt DESC` 정렬
- `GET /reservations/:id` — 상세, 없으면 404 (`NotFoundException`)

**보호**: `src/common/`에 재사용 가능한 `AdminKeyGuard` 신설.

- Guard란: NestJS에서 API 요청이 실제 처리 로직(컨트롤러 함수)에 닿기 전에 세우는 문지기. `@UseGuards(AdminKeyGuard)`를 엔드포인트에 붙이면, 요청이 올 때마다 먼저 이 Guard가 "통과시킬지 말지"를 검사하고, 통과 못 하면 실제 로직은 실행조차 안 되고 바로 거부됨
- `CanActivate`란: Guard가 구현해야 하는 NestJS 표준 규칙(인터페이스) 이름. "이 요청을 활성화(activate)해도 되는가?"를 판단하는 함수 하나만 있으면 됨
- `AdminKeyGuard`의 판단 로직: `ConfigService`(환경변수를 읽는 NestJS 표준 도구)로 서버에 설정된 `ADMIN_API_KEY` 값을 가져와서, 요청 헤더의 `x-admin-key`와 같은지 비교만 함

두 신규 엔드포인트에 `@UseGuards(AdminKeyGuard)` 적용. 기존 `POST /reservations`(사용자가 신청서 제출할 때 쓰는 공개 엔드포인트)는 그대로 둔다. 이 가드는 2단계(PATCH 상태 변경, 기존 쓰기 API 보호)에서도 재사용한다.

**서비스**: `ReservationsService`에 `findAll()`, `findOne(id)` 추가. 기존 `common/testing/mock-repository.ts` 패턴으로 유닛 테스트 작성 (`findAll`/`findOne`, `AdminKeyGuard`).

개인정보(신청자 이름/연락처)가 담기는 엔드포인트라 1단계부터 바로 보호한다 — 2단계로 미루지 않는다.

## 프런트엔드 설계 (`apps/frontend`)

- `middleware.ts` (신규, 루트) — `/admin/*`(로그인 페이지 제외) 요청마다 쿠키 검증, 실패 시 `/admin/login` 리다이렉트
- `lib/session.ts` (신규) — `jose` 기반 쿠키 서명/검증 헬퍼. `middleware.ts`와 로그인/로그아웃 Server Action이 공유
- `app/admin/login/page.tsx` — 비밀번호 입력 폼
- `app/admin/page.tsx` — `/admin/reservations`로 리다이렉트 (2·3단계에서 메뉴 페이지로 확장 가능)
- `app/admin/reservations/page.tsx` — 목록. 필터/검색 없이 최신순 단순 목록 (날짜/체험·숙박명/신청자명/연락처 표시, 행 클릭 시 상세로 이동)
- `app/admin/reservations/[id]/page.tsx` — 상세 (희망일자/인원수/요청사항 등 전체 필드), 없는 id는 `notFound()`
- `lib/api.ts`에 `getReservations()`, `getReservationById(id)` 추가 — 서버 전용 `ADMIN_API_KEY`를 `x-admin-key` 헤더로 첨부해 백엔드 호출
- `lib/actions.ts`에 `loginAdmin(formData)`(비밀번호 검증 + 쿠키 발급), `logoutAdmin()`(쿠키 삭제) 추가

### 신규 환경변수

- 백엔드 `apps/backend/.env` (커밋 안 함): `ADMIN_API_KEY`
- 프런트엔드 `apps/frontend/.env.local` (신규 파일, 커밋 안 함): `ADMIN_PASSWORD`, `ADMIN_API_KEY`(백엔드와 동일 값), `SESSION_SECRET`

## 데이터 흐름

1. 관리자가 `/admin/reservations` 접근 → `middleware.ts`가 쿠키 확인 → 없으면 `/admin/login`으로 리다이렉트
2. 비밀번호 제출 → Server Action이 `ADMIN_PASSWORD`와 비교 → 일치 시 서명 쿠키 발급 → `/admin/reservations`로 리다이렉트
3. `middleware.ts`가 쿠키 검증 통과 → 목록 페이지(서버 컴포넌트)가 `getReservations()` 호출 → 백엔드 `GET /reservations`(`x-admin-key` 헤더 포함) → `AdminKeyGuard` 통과 → `createdAt DESC`로 조회 → 목록 렌더
4. 행 클릭 → `/admin/reservations/[id]` → `getReservationById(id)` → 백엔드 `GET /reservations/:id` → 없으면 404 → `notFound()`

## 에러 처리

- 비밀번호 불일치 → 로그인 폼에 에러 문구 표시, 쿠키 발급 안 함
- 쿠키 만료/위조 → `middleware.ts`가 로그인으로 리다이렉트
- 존재하지 않는 예약 id → `notFound()` (404 페이지)
- `x-admin-key` 불일치(설정 오류 상황) → 별도 처리 없이 요청 실패를 그대로 노출 (개발 단계 설정 문제로 간주, 정상 운영 중엔 발생하지 않아야 함)

## 테스트

- 백엔드: `ReservationsService.findAll`/`findOne` 유닛 테스트(기존 mock-repository 패턴), `AdminKeyGuard` 유닛 테스트
- 프런트엔드: 기존과 동일하게 자동 테스트 프레임워크 없음 — 로그인/리다이렉트/목록/상세/로그아웃 흐름을 개발 서버에서 수동 확인

## 범위 밖 (다음 단계)

- 예약 상태 변경(확인/보류) — 2단계
- 기존 콘텐츠 쓰기 API(`POST /experiences` 등) 보호 — 2단계
- 체험/숙박/공지 CRUD 관리 UI — 3단계
- 목록 필터/검색/페이지네이션 — 신청 건수가 늘어나면 추후 추가
