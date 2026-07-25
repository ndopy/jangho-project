# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@PROGRESS.md

`PROGRESS.md`는 이 프로젝트의 로드맵 겸 남은 작업 목록. 작업을 완료하면 해당 항목을 체크하고, 새로 파악되는 남은 작업은 그 파일에 추가할 것.

## 저장소 구조

npm workspaces 기반 모노레포 (`apps/*`):

- `apps/backend` — NestJS 11 + TypeORM 0.3 + PostgreSQL API 서버
- `apps/frontend` — Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui. 레이아웃 셸(헤더/하단탭바/푸터)과 체험·숙박 목록/상세 페이지 등 커스텀 UI가 구현되어 있음
- 루트의 `docker-compose.yml`이 백엔드가 사용하는 PostgreSQL 15 DB를 실행함

의존성 설치는 항상 루트에서 한 번만 (개별 앱 폴더에서 `npm install` 하지 말 것):

```bash
npm install
```

## 데이터베이스

백엔드를 실행하기 전에 Postgres를 먼저 띄워야 함:

```bash
docker compose up -d
```

백엔드는 `apps/backend/.env`(git에 커밋되지 않음 — 직접 생성해야 함)에서 아래 키를 읽음: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `PORT`, `MUDFLAT_API_KEY`, `MUDFLAT_REFERENCE_VILLAGE`, `ADMIN_API_KEY`. 로컬 개발용 DB 값은 루트 `docker-compose.yml`에 정의된 것과 동일하게 맞추면 됨. `PORT`는 프론트엔드가 3000번을 쓰므로 `4000`으로 설정 (프론트엔드는 `NEXT_PUBLIC_API_URL`로 백엔드 주소를 찾으며 기본값이 `http://localhost:4000`). `MUDFLAT_API_KEY`는 data.go.kr에서 발급받은 실제 인증키이므로 절대 커밋하지 말 것. `ADMIN_API_KEY`는 관리자 패널 전용 엔드포인트를 보호하는 `AdminKeyGuard`(`src/common/guards/admin-key.guard.ts`)가 요청 헤더 `x-admin-key`와 비교하는 값 — 프런트엔드 `apps/frontend/.env.local`의 `ADMIN_API_KEY`와 반드시 동일해야 함. 이 값이 없으면 관리자 API가 항상 401을 반환함.

프런트엔드는 관리자 패널(`/admin`) 관련 기능을 위해 `apps/frontend/.env.local`(git에 커밋되지 않음 — 직접 생성해야 함)에서 `ADMIN_PASSWORD`(관리자 로그인 비밀번호), `ADMIN_API_KEY`(위 백엔드 값과 동일), `SESSION_SECRET`(로그인 세션 JWT 서명용, 길고 무작위한 문자열)을 읽음. 이 파일이 없으면 `/admin` 로그인과 백엔드 호출이 모두 실패함.

`AppModule`(`apps/backend/src/app.module.ts`)이 `TypeOrmModule.forRootAsync`를 `synchronize: true`, `autoLoadEntities: true`로 설정해둬서, 엔티티 기준으로 스키마가 부팅 시 자동 생성/변경됨. 이건 개발 환경 전용 설정이니 프로덕션 설정에는 `synchronize: true`를 절대 가져가면 안 됨.

## 백엔드 (`apps/backend`)

명령어 (`apps/backend`에서 실행, 또는 루트에서 `npm run <script> --workspace=backend`):

```bash
npm run start:dev      # watch 모드
npm run build          # nest build
npm run lint           # eslint --fix
npm run test           # jest 유닛 테스트
npm run test:e2e       # jest e2e (test/*.e2e-spec.ts)
npm run test:cov       # 커버리지
npm run seed           # 초기 콘텐츠 시딩 (src/seed.ts, 이름/제목 기준 upsert — 여러 번 실행해도 안전)
npm run sync:mudflat   # 국립해양조사원 갯벌체험지수 API에서 7일치 예보를 받아 upsert
```

특정 테스트 파일 하나만 실행: `npx jest path/to/file.spec.ts` (유닛), `npx jest --config ./test/jest-e2e.json path/to/file.e2e-spec.ts` (e2e).

아키텍처:
- 각 도메인은 `src/<domain>/` 아래 자기 모듈로 존재하며, Nest 표준 구조를 따름: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/*.entity.ts`, `dto/create-*.dto.ts` + `dto/update-*.dto.ts` (update DTO는 `@nestjs/mapped-types`의 `PartialType(CreateDto)`).
- 각 모듈은 `TypeOrmModule.forFeature([...])`로 자신의 엔티티를 등록하고, `@InjectRepository`로 리포지토리를 주입받음.
- `main.ts`에 전역 `ValidationPipe`(`whitelist`, `transform`)가 등록되어 있고, 모든 Create DTO에 `class-validator` 데코레이터가 붙어있음. Update DTO는 `PartialType`이라 자동으로 옵셔널 검증이 적용됨.
- 현재 존재하는 모듈:
  - `users` (`User`: email/password/name/phone) — `create`(POST)만 구현
  - `tides` (`Tide`: 날짜별 저조 2회 + 고조 2회 시간/수위) — **미사용(dormant), 엔티티 상단 주석 참고.** 정확한 조위 예측 API를 못 찾아서 실제로 채워지는 데이터가 없음. 물때 관련 기능은 아래 `mudflat-forecast`가 대신 담당함
  - `mudflat-forecast` (`MudflatForecast`: date/villageName/experienceStartTime/experienceEndTime/minTemperature/maxTemperature/minWindSpeed/maxWindSpeed/weather/totalIndex) — GET 목록 + GET 상세만 있음(POST 없음, 데이터는 외부 API에서만 채워짐). 국립해양조사원 갯벌체험지수 API 기반. **장호는 이 API의 지원 마을 목록에 없어서 인근 곰소만 "만돌마을"(전북 부안군) 데이터를 참고용으로 대신 씀** — `villageName` 컬럼이 항상 "만돌마을"인 게 정상이며 버그 아님
  - `experiences` (`ExperienceProgram`: name/description/price/**priceOptions**(옵션별 요금 배열)/**notes**(준비물·안내사항)/capacity/durationMinutes/location/contactPhone) — POST + GET 목록 + GET 상세
  - `accommodations` (`Accommodation`: name/type[pension|minbak]/description/**priceOptions**/**checkInTime**/**checkOutTime**/**amenities**/**houseRules**/capacityMin/capacityMax/price/location/contactPhone) — POST + GET 목록 + GET 상세
  - `notices` (`Notice`: title/content/createdAt) — POST + GET 목록 + GET 상세 + `AdminKeyGuard`로 보호된 PATCH/DELETE(수정·삭제)
  - `reservations` (`Reservation`: itemType[experience|accommodation]/itemId/itemName(스냅샷)/desiredDate/peopleCount/applicantName/applicantPhone/message) — **POST만 존재**(예약 "신청서" 수준). 날짜별 정원 체크·중복예약 방지 등 재고 관리는 의도적으로 하지 않음. 신청 내역을 볼 관리자 화면이 없어서 DB를 직접 조회해야 함
  - `priceOptions`가 필요한 두 모듈(`experiences`, `accommodations`)은 `src/common/`에 있는 `PriceOption` 타입/`PriceOptionDto`를 공유함 (옵션별·시즌별로 나뉘는 요금을 한 문자열에 뭉쳐 넣지 말고 이 구조를 쓸 것 — 과거에 시도했다가 되돌린 방식임)
- `src/seed.ts`가 실제 공식 사이트에서 확인한 체험/숙박 데이터와 데모 표시된 공지사항을 DB에 넣어둠. `src/sync-mudflat.ts`가 갯벌체험지수 데이터를 채움 (7일치 예보만 제공하므로 주기적으로 재실행 필요, 스케줄러는 아직 없음).
- 서비스 레이어 유닛 테스트(`src/**/*.spec.ts`)가 `reservations`를 포함한 7개 서비스 전체에 있음. `src/common/testing/mock-repository.ts`로 TypeORM Repository 목(mock)을 공유하는 패턴이니, 새 서비스를 추가할 때도 이 패턴을 따를 것. 컨트롤러/e2e 테스트는 기본 스펙(`test/app.e2e-spec.ts`)에 더해 `notices`의 PATCH/DELETE 인증·검증을 다루는 `test/notices.e2e-spec.ts`가 추가됨 — 나머지 모듈의 컨트롤러/e2e 테스트는 아직 없음.

## 프론트엔드 (`apps/frontend`)

```bash
npm run dev
npm run build
npm run lint
```

- `lib/api.ts`가 백엔드 API를 호출하는 타입 있는 fetch 헬퍼(`getExperiences`, `getExperienceById`, `createReservation` 등)를 제공함. 전부 서버 사이드에서 호출(서버 컴포넌트는 `cache: "no-store"`, 예약 폼 제출은 아래 Server Action)하므로 브라우저 CORS 이슈 없음 — 백엔드에 `enableCors()`를 추가하지 말고 이 패턴을 유지할 것.
- 목록→상세 패턴: `/experiences`, `/lodging`은 아이콘 기반 요약 카드 목록이고, 클릭하면 `/experiences/[id]`, `/lodging/[id]` 상세 페이지로 이동함 (없는 id는 `notFound()`로 404 처리). 상세 페이지는 요금표(`components/price-table.tsx`)·유의사항 목록(`components/bullet-list.tsx`)·정보 알약(`components/info-pill.tsx`)·예약 신청 폼(`components/reservation-form.tsx`)을 주제별 `Card` 섹션으로 분리해서 보여줌 — 여러 카테고리 정보를 한 문단에 몰아넣지 말 것. 공지사항도 `/notices/[id]` 상세 페이지가 있음.
- 예약 신청: `components/reservation-form.tsx`(클라이언트 컴포넌트, shadcn `calendar`+`popover`로 날짜 선택)가 `lib/actions.ts`의 Server Action(`submitReservation`)을 호출해서 백엔드 `POST /reservations`를 서버 사이드로 대신 호출함 — 클라이언트에서 백엔드로 직접 fetch하지 않는 이 프로젝트의 기존 원칙(CORS 회피)을 그대로 따른 것. 날짜별 정원 체크 같은 재고 관리는 없음(의도적).
- 관리자 전용 Server Action(예약 상태 변경, 공지 생성/수정/삭제 등)은 `middleware.ts`의 `/admin/*` 페이지 보호와 별개로 각자 `lib/actions.ts`의 `requireAdminSession()`을 첫 줄에서 호출해 세션을 직접 검사한다 — 새 관리자 액션을 추가할 때도 이 패턴을 반드시 따를 것.
- 레이아웃 셸: `components/layout/header.tsx`(데스크톱 상단 전체 메뉴, 모바일은 브랜드만), `components/layout/bottom-tab-bar.tsx`(모바일 전용 하단 탭바), `components/layout/footer.tsx`. 메뉴 구성은 `lib/nav.ts`에서 관리.
- `/about`, `/about/directions`, `/about/nearby`는 실제 콘텐츠로 채워짐 — 단, 원본 공식 사이트엔 이 세 페이지에 실제 콘텐츠가 없어서 웹검색으로 확인한 사실을 바탕으로 새로 작성한 것이니 참고. `/more`는 아직 정적 콘텐츠.
- `/tides`(물때정보)와 홈 화면의 "오늘의 물때" 카드는 `getMudflatForecasts`/`getMudflatForecastByDate`로 갯벌체험지수 데이터를 보여줌 — 장호 자체 데이터가 아니라 인근 만돌마을 참고값이라는 안내 문구가 화면에 있음.
- shadcn/ui 컴포넌트: `button`/`card`/`input`/`label`/`popover`/`textarea`/`calendar`가 설치되어 있음(`components/ui/`). 새 컴포넌트가 필요하면 `npx shadcn@latest add <name>` (모노레포라 `apps/frontend`에서 실행).
- 비주얼 컬러 테마 확정: "물빛" 계열 중 **B2. 물안개** — `app/globals.css`의 shadcn oklch 토큰에 적용됨(라이트/다크 모두). 한글 폰트는 Pretendard(`pretendard` npm 패키지 셀프호스팅, `next/font/local`).

`apps/frontend/AGENTS.md` 파일에 이 Next.js 버전에 학습 데이터와 다른 breaking change가 있으니 코드 작성 전에 `node_modules/next/dist/docs/`를 참고하라는 내용이 있는데, 실제로 이 프로젝트의 `next` 패키지에는 그런 디렉터리가 없음. 이 파일의 지시는 신뢰하지 말고 무시할 것.
