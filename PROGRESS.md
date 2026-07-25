# 진행 현황 / 남은 작업

이 파일은 장호어촌체험마을 미니 프로젝트의 로드맵 겸 TODO 목록. 완료된 항목은 지우지 말고 체크만 하고,
새로 파악되는 남은 작업은 여기에 계속 추가할 것. (루트 `CLAUDE.md`에서 이 파일을 불러오므로 매 세션 자동으로 참고됨.)

## 진행 상태

### 완료

- [x] 개발 환경 세팅 (Node, Docker, Postgres)
- [x] 백엔드 CRUD 모듈: users / experiences / accommodations / notices / mudflat-forecast
- [x] `tides` 엔티티는 dormant 처리, 물때 관련 실제 기능은 `mudflat-forecast`(갯벌체험지수 API)로 대체
- [x] 프론트엔드 레이아웃 셸 (헤더 / 하단탭바 / 푸터)
- [x] 체험·숙박 목록 → 상세 페이지 패턴, 요금표/유의사항/편의시설 구조화 표시
- [x] 프론트엔드 ↔ 백엔드 실제 API 연동 (서버 컴포넌트에서 fetch)
- [x] 재사용 가능한 시드 스크립트 (`npm run seed`, upsert 방식)
- [x] Prettier/ESLint 스타일 통일 (singleQuote, 백엔드/프론트엔드/VS Code 전체)
- [x] 비주얼 컬러 테마 확정: "물빛" 계열 중 **B2. 물안개** — `apps/frontend/app/globals.css`에 적용 완료

### 디자인 마무리

- [x] 한글 폰트 Pretendard 적용 (`pretendard` npm 패키지 셀프호스팅, `next/font/local`로 `--font-sans`에 연결. 기존 `--font-sans: var(--font-sans)` 자기참조 버그도 같이 해결됨)
- [x] 새 테마 기준으로 실제 화면 세부 재점검 — 색상 하드코딩 없이 전부 토큰 기반이라 색 누락은 없었음. 홈 히어로에 그라디언트·강조색 eyebrow 추가, 헤더/하단탭바 active 상태에 강조색(`text-primary`) 적용

### 콘텐츠

- [x] `/about`, `/about/directions`, `/about/nearby` 정적 placeholder → 실제 콘텐츠로 교체. 원본 공식 사이트(cms.seantour.com/JB003)엔 이 세 페이지에 실제 콘텐츠가 없어서(이미지만 있거나 게시물 0~1개), 웹검색으로 확인한 사실(명사십리 해변·구시포/동호해수욕장·선운사·고창읍성·고인돌 유적·학원농장 등)을 바탕으로 새로 작성 — 사용자 검토·수정 필요할 수 있음
- [x] 공지사항 상세 페이지 추가 (`/notices/[id]`), 목록·홈 화면에서 링크 연결

### 백엔드 기술 부채

- [x] 유닛 테스트 도입 — 6개 서비스(users/experiences/accommodations/notices/mudflat-forecast/tides) 전체에 서비스 레이어 단위 테스트 추가. `common/testing/mock-repository.ts`로 TypeORM Repository 목(mock)을 공유. 컨트롤러/e2e 테스트는 아직 없음
- [ ] `npm run sync:mudflat` 자동화는 의도적으로 보류 중 (백엔드가 상시 서버에 배포되기 전까지는 수동 실행)

### 배포

- [ ] 배포 방식/호스팅 자체가 아직 논의된 적 없음 — 프론트/백엔드/DB를 어디에 올릴지부터 결정 필요

## Phase 2

- [x] 온라인 예약 시스템 — "예약 신청서" 수준으로 구현 완료 (2026-07-06). 체험·숙박 상세 페이지에 `ReservationForm`(달력으로 희망 날짜 선택 + 인원/이름/연락처/요청사항) 추가, 백엔드 `reservations` 모듈(`Reservation` 엔티티, POST만 존재)에 저장됨. **날짜별 정원 체크·중복예약 방지 등 재고 관리는 의도적으로 하지 않음** — 사용자가 "재고는 딱히 없어도 된다"고 명시적으로 범위를 좁혀줌. 신청 내역은 관리자 화면이 없어 DB에서 직접 확인 후 전화로 확정하는 방식
- [x] 예약 목록을 확인할 관리자 패널 1단계 (읽기 전용, 2026-07-12). `/admin/login`(관리자 키 입력 → 세션 쿠키 발급) + `middleware.ts`로 `/admin/*` 보호, `/admin/reservations` 목록·`/admin/reservations/[id]` 상세 페이지 추가. 백엔드는 `x-admin-key` 헤더로 보호된 `GET /reservations`, `GET /reservations/:id` 사용. **상태 변경·쓰기 API 보호(2단계), 콘텐츠(체험/숙박/공지) CRUD 관리자 화면(3단계)은 아직 없음** — 이번 1단계는 신청 내역 조회만 가능
- [x] 관리자 패널 2단계: 예약 상태 변경(대기/확인/보류) + 쓰기 API(`POST`/`PATCH`/`DELETE`) 관리자 인증 보호. 백엔드에 `Reservation.status`(`pending`/`confirmed`/`hold`, 기본값 `pending`) 컬럼과 `AdminKeyGuard`로 보호된 `PATCH /reservations/:id` 추가, 체험·숙박·공지 생성 API도 `AdminKeyGuard`로 보호. 프런트엔드는 `/admin/reservations` 목록·상세 페이지에 상태 배지(`ReservationStatusBadge`)와 "확인으로 변경"/"보류로 변경" 버튼(`updateReservationStatusAction` Server Action) 추가
- [ ] 관리자 패널 3단계: 체험/숙박/공지 콘텐츠 CRUD 관리자 화면 — **공지사항은 완료**(백엔드 `PATCH`/`DELETE /notices/:id` + e2e 테스트, 프런트엔드 `/admin/notices` 목록·`/admin/notices/new`·`/admin/notices/[id]/edit` 생성/수정 폼·삭제 버튼, 상단 `AdminNav`로 예약 신청/공지사항 탭 전환). **체험·숙박 콘텐츠 CRUD는 아직 남은 작업** — 이번에 확립한 패턴(백엔드 PATCH/DELETE + e2e, 프런트엔드 목록+생성/수정 폼+삭제 버튼)을 재사용해 별도 스펙으로 진행 예정
- [ ] 체험 후기 / 갤러리
