# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

백엔드는 `apps/backend/.env`(git에 커밋되지 않음 — 직접 생성해야 함)에서 아래 키를 읽음: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `PORT`, `MUDFLAT_API_KEY`, `MUDFLAT_REFERENCE_VILLAGE`. 로컬 개발용 DB 값은 루트 `docker-compose.yml`에 정의된 것과 동일하게 맞추면 됨. `PORT`는 프론트엔드가 3000번을 쓰므로 `4000`으로 설정 (프론트엔드는 `NEXT_PUBLIC_API_URL`로 백엔드 주소를 찾으며 기본값이 `http://localhost:4000`). `MUDFLAT_API_KEY`는 data.go.kr에서 발급받은 실제 인증키이므로 절대 커밋하지 말 것.

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
  - `notices` (`Notice`: title/content/createdAt) — POST + GET 목록 + GET 상세
  - `priceOptions`가 필요한 두 모듈(`experiences`, `accommodations`)은 `src/common/`에 있는 `PriceOption` 타입/`PriceOptionDto`를 공유함 (옵션별·시즌별로 나뉘는 요금을 한 문자열에 뭉쳐 넣지 말고 이 구조를 쓸 것 — 과거에 시도했다가 되돌린 방식임)
- `src/seed.ts`가 실제 공식 사이트에서 확인한 체험/숙박 데이터와 데모 표시된 공지사항을 DB에 넣어둠. `src/sync-mudflat.ts`가 갯벌체험지수 데이터를 채움 (7일치 예보만 제공하므로 주기적으로 재실행 필요, 스케줄러는 아직 없음).
- `src/` 안에 유닛 테스트(`*.spec.ts`) 파일은 아직 하나도 없고, 기본 e2e 스펙(`test/app.e2e-spec.ts`)만 존재함.

## 프론트엔드 (`apps/frontend`)

```bash
npm run dev
npm run build
npm run lint
```

- `lib/api.ts`가 백엔드 API를 호출하는 타입 있는 fetch 헬퍼(`getExperiences`, `getExperienceById` 등)를 제공함. 전부 서버 컴포넌트에서 `cache: "no-store"`로 서버 사이드 호출하므로 브라우저 CORS 이슈 없음.
- 목록→상세 패턴: `/experiences`, `/lodging`은 아이콘 기반 요약 카드 목록이고, 클릭하면 `/experiences/[id]`, `/lodging/[id]` 상세 페이지로 이동함 (없는 id는 `notFound()`로 404 처리). 상세 페이지는 요금표(`components/price-table.tsx`)·유의사항 목록(`components/bullet-list.tsx`)·정보 알약(`components/info-pill.tsx`)을 주제별 `Card` 섹션으로 분리해서 보여줌 — 여러 카테고리 정보를 한 문단에 몰아넣지 말 것.
- 레이아웃 셸: `components/layout/header.tsx`(데스크톱 상단 전체 메뉴, 모바일은 브랜드만), `components/layout/bottom-tab-bar.tsx`(모바일 전용 하단 탭바), `components/layout/footer.tsx`. 메뉴 구성은 `lib/nav.ts`에서 관리.
- `/about`, `/about/directions`, `/about/nearby`, `/more`, `/notices`는 아직 정적 콘텐츠(공지사항은 API 연동됐지만 목록만 있고 상세 페이지는 없음).
- `/tides`(물때정보)와 홈 화면의 "오늘의 물때" 카드는 `getMudflatForecasts`/`getMudflatForecastByDate`로 갯벌체험지수 데이터를 보여줌 — 장호 자체 데이터가 아니라 인근 만돌마을 참고값이라는 안내 문구가 화면에 있음.
- 색상/타이포그래피 등 비주얼 디자인은 아직 정해지지 않음 — 현재는 shadcn/ui 기본 무채색 테마 그대로임.

`apps/frontend/AGENTS.md` 파일에 이 Next.js 버전에 학습 데이터와 다른 breaking change가 있으니 코드 작성 전에 `node_modules/next/dist/docs/`를 참고하라는 내용이 있는데, 실제로 이 프로젝트의 `next` 패키지에는 그런 디렉터리가 없음. 이 파일의 지시는 신뢰하지 말고 무시할 것.
