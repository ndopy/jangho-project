# 장호어촌체험마을

전북 고창 **장호어촌체험마을**의 홈페이지를 새로 만들어보는 개인 미니 프로젝트입니다.

## 왜 만드나요

장호어촌체험마을은 [기존 공식 홈페이지](https://cms.seantour.com/JB003/index.do)(한국어촌어항공단 운영)가 있지만, 모바일 대응이 부족하고 온라인 예약 기능이 없어(전화 문의만 가능) 실질적으로 잘 활용되지 않고 있습니다. 이 프로젝트는 그 자리를 대체할 수 있는, 모바일 친화적이고 실제로 쓸모 있는 사이트를 직접 만들어보는 것을 목표로 합니다.

## 현재 범위 (MVP)

지금은 **정보 제공 중심의 1단계(MVP)**를 만들고 있습니다. 예약 기능과 관리자 페이지는 의도적으로 다음 단계로 미뤄뒀습니다.

- 마을소개 / 오시는길 / 주변관광지
- 체험 프로그램 소개 (승마체험, 조개캐기, 후릿그물)
- 숙박시설 소개 (펜션, 민박)
- 물때(조석) 정보
- 공지사항
- 예약/문의는 전화 연결만 제공 (온라인 예약 폼은 2단계 예정)

## 기술 스택

npm workspaces 기반 모노레포입니다.

- Backend: NestJS 11, TypeORM 0.3, PostgreSQL, class-validator 기반 요청 유효성 검사
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- Infra: Docker Compose (로컬 PostgreSQL)

## API

| 리소스 | 엔드포인트 |
| --- | --- |
| 회원 | `POST /users` |
| 물때 | `POST /tides`, `GET /tides` (`from`/`to` 기간 필터), `GET /tides/:date` |
| 체험 프로그램 | `POST /experiences`, `GET /experiences`, `GET /experiences/:id` |
| 숙박시설 | `POST /accommodations`, `GET /accommodations`, `GET /accommodations/:id` |
| 공지사항 | `POST /notices`, `GET /notices`, `GET /notices/:id` |

아직 관리자 화면이 없어서, 콘텐츠 등록은 위 `POST` 엔드포인트를 직접 호출하거나 아래 시드 스크립트로 합니다.

## 로컬 실행

**요구사항**: Node.js 20+, Docker Desktop

```bash
# 1. 의존성 설치 (루트에서 한 번만)
npm install

# 2. DB 실행
docker compose up -d

# 3. apps/backend/.env 생성 (docker-compose.yml 값과 맞추기)
# DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
# PORT=4000  (프론트엔드가 3000번을 쓰므로 백엔드는 다른 포트 사용)

# 4. 백엔드 실행
npm run start:dev --workspace=backend

# 5. (선택) 초기 데이터 시딩 — 실행할 때마다 이미 있는 데이터는 건너뜀
npm run seed --workspace=backend

# 6. 프론트엔드 실행
npm run dev --workspace=frontend
```

프론트엔드는 기본적으로 <http://localhost:3000>, 백엔드는 <http://localhost:4000> 에서 열립니다. 프론트엔드가 백엔드를 호출하는 주소는 `NEXT_PUBLIC_API_URL` 환경변수로 바꿀 수 있고, 기본값은 `http://localhost:4000`입니다.

## 로드맵

- [ ] 1단계 — 정보 제공 (마을소개, 체험/숙박 소개, 물때정보, 공지사항) — 진행 중. 백엔드 API, 프론트-백엔드 연동, 체험/숙박/공지사항 콘텐츠 시딩까지 완료. 물때 데이터 시딩과 마을소개·오시는길·주변관광지 콘텐츠는 아직
- [ ] 2단계 — 온라인 예약 (체험/숙박), 회원 연동
- [ ] 3단계 — 체험리뷰, 갤러리, 관리자 페이지

더 자세한 개발 가이드(명령어, 아키텍처)는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
