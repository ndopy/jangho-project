# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 저장소 구조

npm workspaces 기반 모노레포 (`apps/*`):

- `apps/backend` — NestJS 11 + TypeORM 0.3 + PostgreSQL API 서버
- `apps/frontend` — Next.js 16 (App Router) + React 19 + Tailwind 4. 현재는 `create-next-app` 기본 스캐폴딩 그대로임 (커스텀 UI 없음)
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

백엔드는 `apps/backend/.env`(git에 커밋되지 않음 — 직접 생성해야 함)에서 아래 키를 읽음: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`. 로컬 개발용 값은 루트 `docker-compose.yml`에 정의된 것과 동일하게 맞추면 됨.

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
```

특정 테스트 파일 하나만 실행: `npx jest path/to/file.spec.ts` (유닛), `npx jest --config ./test/jest-e2e.json path/to/file.e2e-spec.ts` (e2e).

아키텍처:
- 각 도메인은 `src/<domain>/` 아래 자기 모듈로 존재하며, Nest 표준 구조를 따름: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/*.entity.ts`, `dto/create-*.dto.ts` + `dto/update-*.dto.ts` (update DTO는 `@nestjs/mapped-types`의 `PartialType(CreateDto)`).
- 각 모듈은 `TypeOrmModule.forFeature([...])`로 자신의 엔티티를 등록하고, `@InjectRepository`로 리포지토리를 주입받음.
- 현재 존재하는 모듈: `users`(`User` 엔티티: email/password/name/phone), `tides`(`Tide` 엔티티: 날짜별 1행, 저조 최대 2회 + 고조 최대 2회의 시간/수위). 둘 다 아직 `create`(POST)만 구현되어 있고 조회/수정/삭제 엔드포인트는 없음.
- `src/` 안에 유닛 테스트(`*.spec.ts`) 파일은 아직 하나도 없고, 기본 e2e 스펙(`test/app.e2e-spec.ts`)만 존재함.

## 프론트엔드 (`apps/frontend`)

```bash
npm run dev
npm run build
npm run lint
```

아직 `create-next-app` 기본 스캐폴딩 그대로임(`app/page.tsx`, `app/layout.tsx`) — 커스텀 UI나 백엔드 API 연동은 아직 구현되지 않음.

`apps/frontend/AGENTS.md` 파일에 이 Next.js 버전에 학습 데이터와 다른 breaking change가 있으니 코드 작성 전에 `node_modules/next/dist/docs/`를 참고하라는 내용이 있는데, 실제로 이 프로젝트의 `next` 패키지에는 그런 디렉터리가 없음. 이 파일의 지시는 신뢰하지 말고 무시할 것.
