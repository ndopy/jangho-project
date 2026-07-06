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
- [ ] `/about`, `/about/directions`, `/about/nearby` 정적 placeholder → 실제 콘텐츠로 교체
- [ ] 공지사항 상세 페이지 필요 여부 결정 (현재 목록만 있고 상세 라우트 없음)

### 백엔드 기술 부채
- [ ] 유닛 테스트 전무 (`src/**/*.spec.ts` 없음, 기본 e2e 스펙만 존재) — 서비스 레이어부터 시작 고려
- [ ] `npm run sync:mudflat` 자동화는 의도적으로 보류 중 (백엔드가 상시 서버에 배포되기 전까지는 수동 실행)

### 배포
- [ ] 배포 방식/호스팅 자체가 아직 논의된 적 없음 — 프론트/백엔드/DB를 어디에 올릴지부터 결정 필요

## Phase 2 (지금 착수하지 않음 — 순서상 나중)
- [ ] 온라인 예약 시스템 (`Reservation` 엔티티 등)
- [ ] 관리자 패널
- [ ] 체험 후기 / 갤러리
