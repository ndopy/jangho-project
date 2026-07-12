# 관리자 패널 2-A (콘텐츠 쓰기 API 보호) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 콘텐츠 생성 API(`POST /experiences`, `POST /accommodations`, `POST /notices`) 3개를 1단계에서 만든 `AdminKeyGuard`로 보호한다.

**Architecture:** 각 컨트롤러의 기존 `create()` 메서드에 `@UseGuards(AdminKeyGuard)` 데코레이터만 추가한다. 새 엔드포인트·DTO·엔티티·서비스 로직은 없다.

**Tech Stack:** NestJS 11 (백엔드만 — 이 API들을 호출하는 프런트엔드 화면이 아직 없어 프런트엔드 변경 없음)

**Spec:** `docs/superpowers/specs/2026-07-12-admin-write-api-protection-design.md`

## Global Constraints

- 백엔드를 실행하기 전 Postgres가 떠 있어야 한다: 저장소 루트에서 `docker compose up -d` (이미 컨테이너가 있으면 `docker start jangho_postgres`).
- `apps/backend/.env`에 `ADMIN_API_KEY`가 설정되어 있어야 한다. 이 값이 없으면 관리자 API가 항상 401을 반환한다 — 새 워크트리 등 이 값이 없는 환경에서 작업한다면, 저장소 루트 `CLAUDE.md`에 문서화된 이름대로 `ADMIN_API_KEY=<임의의 문자열>` 한 줄을 `apps/backend/.env`에 추가한다(이미 이 값이 있으면 그대로 사용 — 재사용하는 값과 curl 검증에 쓰는 값이 반드시 같아야 함).
- 코드 스타일은 기존 파일들과 동일하게 싱글 쿼트(Prettier singleQuote)를 따른다.
- `AdminKeyGuard`(`apps/backend/src/common/guards/admin-key.guard.ts`)는 1단계에서 이미 만들어져 있고 유닛 테스트로 검증되어 있다 — 이번 태스크에서 새로 만들거나 수정하지 않고, 어떤 모듈의 `providers` 배열에도 등록하지 않는다(NestJS가 `@UseGuards(클래스참조)`만으로 전역 `ConfigService`를 통해 자동 주입함).
- 새 유닛 테스트는 추가하지 않는다 — 가드 자체의 동작은 1단계에서 이미 테스트됐고, 이번 변경은 기존 컨트롤러에 데코레이터를 붙이는 것뿐이라 curl 기반 수동 검증으로 충분하다(spec의 "테스트" 섹션 참고).

---

### Task 1: 기존 쓰기 API 3곳에 AdminKeyGuard 적용 + 검증

**Files:**
- Modify: `apps/backend/src/experiences/experiences.controller.ts`
- Modify: `apps/backend/src/accommodations/accommodations.controller.ts`
- Modify: `apps/backend/src/notices/notices.controller.ts`

**Interfaces:**
- Consumes: `AdminKeyGuard`(`../common/guards/admin-key.guard`) — 1단계에서 이미 존재
- Produces: 없음(외부에서 이 세 컨트롤러의 `create()`를 호출하는 다른 코드는 없음 — 3단계에서 콘텐츠 관리 화면을 만들 때 이 보호된 엔드포인트를 그대로 사용하게 됨)

- [ ] **Step 1: `experiences.controller.ts`에 가드 적용**

`apps/backend/src/experiences/experiences.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto } from './dto/create-experience.dto';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @UseGuards(AdminKeyGuard)
  @Post()
  create(@Body() createExperienceDto: CreateExperienceDto) {
    return this.experiencesService.create(createExperienceDto);
  }

  @Get()
  findAll() {
    return this.experiencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.experiencesService.findOne(id);
  }
}
```

- [ ] **Step 2: `accommodations.controller.ts`에 가드 적용**

`apps/backend/src/accommodations/accommodations.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @UseGuards(AdminKeyGuard)
  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationsService.create(createAccommodationDto);
  }

  @Get()
  findAll() {
    return this.accommodationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accommodationsService.findOne(id);
  }
}
```

- [ ] **Step 3: `notices.controller.ts`에 가드 적용**

`apps/backend/src/notices/notices.controller.ts` 전체를 다음으로 교체:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';

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
}
```

- [ ] **Step 4: Postgres와 백엔드 개발 서버 기동**

Run: `docker compose up -d` (저장소 루트) — 이미 떠 있으면 `docker start jangho_postgres`
Run (백그라운드로): `npm run start:dev --workspace=backend`
Expected: 콘솔에 `Nest application successfully started` 출력

- [ ] **Step 5: 세 엔드포인트 모두 인증 없이 호출하면 거부되는지 확인**

`apps/backend/.env`에 설정된 `ADMIN_API_KEY` 값을 확인한 뒤(예: `local-dev-admin-key-please-change`), 아래 세 명령을 실행:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/experiences -H "Content-Type: application/json" -d '{"name":"테스트"}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/accommodations -H "Content-Type: application/json" -d '{"name":"테스트","type":"pension"}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/notices -H "Content-Type: application/json" -d '{"title":"테스트","content":"테스트"}'
```

Expected: 셋 다 `401`

- [ ] **Step 6: 잘못된 키로 호출해도 거부되는지 확인**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/experiences -H "Content-Type: application/json" -H "x-admin-key: wrong-key" -d '{"name":"테스트"}'
```

Expected: `401`

- [ ] **Step 7: 올바른 키로 호출하면 통과하는지 확인**

`apps/backend/.env`의 `ADMIN_API_KEY` 값은 이 저장소의 로컬 개발 환경에서는 `local-dev-admin-key-please-change`다(1단계 작업 때 설정됨). 값이 다르게 바뀌어 있다면 아래 명령의 `x-admin-key` 값을 실제 값으로 바꿔서 실행:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/notices -H "Content-Type: application/json" -H "x-admin-key: local-dev-admin-key-please-change" -d '{"title":"가드 확인용 테스트 공지","content":"삭제해도 되는 테스트 데이터입니다."}'
```

Expected: `201` (생성 성공)

- [ ] **Step 8: 기존 유닛 테스트 전체가 여전히 통과하는지 확인**

Run: `npm run test --workspace=backend`
Expected: 모든 테스트 스위트 PASS (회귀 없음 — 이 변경은 기존 테스트가 다루는 로직을 건드리지 않음)

- [ ] **Step 9: Step 7에서 만든 테스트 데이터 정리(선택)**

Step 7에서 만든 테스트용 공지사항은 DB에 남는다. 지워도 되고 남겨둬도 무방하다(seed 데이터가 아니므로 `npm run seed` 재실행에 영향 없음). 지우고 싶다면 `docker exec -it jangho_postgres psql -U jangho_user -d jangho_db -c "DELETE FROM notices WHERE title = '가드 확인용 테스트 공지';"`

- [ ] **Step 10: 커밋**

```bash
git add apps/backend/src/experiences/experiences.controller.ts apps/backend/src/accommodations/accommodations.controller.ts apps/backend/src/notices/notices.controller.ts
git commit -m "feat(backend): 체험·숙박·공지 생성 API를 AdminKeyGuard로 보호"
```

---

## 완료 후 확인

- `PROGRESS.md`의 관리자 패널 로드맵 항목에 2-A 완료를 반영하고, 2-B(예약 상태 변경)가 남아있음을 명시
