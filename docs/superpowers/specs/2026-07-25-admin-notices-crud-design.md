# 관리자 패널 3단계: 공지사항 CRUD

## 배경 / 문제

2단계까지 완료되면서 예약 신청 조회·상태 변경은 관리자 화면에서 처리할 수 있게 됐지만, 체험/숙박/공지 콘텐츠는 여전히 `npm run seed` 스크립트를 고치거나 DB를 직접 조작해야만 등록·수정·삭제할 수 있다. `PROGRESS.md`에 3단계로 남아 있던 "체험/숙박/공지 콘텐츠 CRUD 관리자 화면" 중, 이번 스펙은 스키마가 가장 단순한 공지사항(`title`/`content` 두 필드)부터 다룬다. 여기서 확립한 백엔드·프런트엔드 패턴을 이후 체험/숙박에 그대로 재사용할 계획이다.

## 범위

- 공지사항 생성·수정·삭제를 처리하는 관리자 화면
- 관리자 화면 섹션(예약 신청 / 공지사항) 간 이동을 위한 상단 탭 내비게이션
- 백엔드 e2e 테스트 도입(이미 설치되어 있던 Jest e2e 인프라를 공지사항 컨트롤러부터 실제로 사용)

범위 밖 항목은 문서 마지막에 별도로 정리한다.

## 백엔드 설계

`NoticesService`(`apps/backend/src/notices/notices.service.ts`)에 두 메서드를 추가한다.

```typescript
async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
  const notice = await this.findOne(id);
  const updated = this.noticesRepository.merge(notice, updateNoticeDto);

  return await this.noticesRepository.save(updated);
}

async remove(id: number): Promise<void> {
  const notice = await this.findOne(id);
  await this.noticesRepository.remove(notice);
}
```

`UpdateNoticeDto`는 이미 `apps/backend/src/notices/dto/update-notice.dto.ts`에 `PartialType(CreateNoticeDto)`로 존재하므로 그대로 재사용한다. `update`/`remove` 둘 다 존재하지 않는 id면 기존 `findOne`이 던지는 `NotFoundException`을 그대로 전파받는다.

`NoticesController`(`apps/backend/src/notices/notices.controller.ts`)에 다음 두 엔드포인트를 추가한다.

- `PATCH /notices/:id` — `@UseGuards(AdminKeyGuard)`, body는 `UpdateNoticeDto`
- `DELETE /notices/:id` — `@UseGuards(AdminKeyGuard)`, 응답 바디 없음(기본 200)

`AdminKeyGuard`는 기존 것을 그대로 재사용하며, 기존 `create`(`POST /notices`)에 이미 적용되어 있는 것과 동일한 방식이다.

## 프런트엔드 설계

라우트는 세 개만 만든다. 읽기 전용 상세 페이지는 만들지 않는다 — 이미 공개용 `/notices/[id]` 페이지가 그 역할을 하고 있어서 관리자용으로 또 만들면 중복이기 때문이다.

```
/admin/notices           (목록, 행마다 "수정"/"삭제")
/admin/notices/new       (생성 폼)
/admin/notices/[id]/edit (수정 폼, 기존 값 프리필)
```

`lib/api.ts`에 추가할 것:

- `apiPostAdmin` 헬퍼 — 기존 `apiPatchAdmin`과 같은 구조로 `x-admin-key` 헤더를 붙이되 메서드만 POST. 기존 `apiPost`는 공개용(예약 신청)이라 인증 헤더가 없으므로 재사용할 수 없다.
- `apiDeleteAdmin` 헬퍼 — 같은 구조로 메서드만 DELETE.
- `createNotice(input)`, `updateNotice(id, input)`(기존 `apiPatchAdmin` 재사용), `deleteNotice(id)` 함수.

`lib/actions.ts`에 추가할 것:

- `createNoticeAction(formData)`, `updateNoticeAction(id, formData)` — 성공 시 `redirect('/admin/notices')` 호출 전에 `revalidatePath('/admin/notices')`를 먼저 호출한다.
- `deleteNoticeAction(id)` — 목록 페이지에 그대로 머무르므로 `revalidatePath('/admin/notices')`만 호출한다.

새 컴포넌트:

- `components/notice-form.tsx` — 생성·수정 공용 클라이언트 컴포넌트. `reservation-form.tsx`와 같은 스타일(controlled input, 제출 중 상태, 에러 메시지)을 따른다. `initialValues`와 `noticeId`를 옵셔널 props로 받아서, `noticeId`가 있으면 수정 모드(`updateNoticeAction` 호출)로, 없으면 생성 모드(`createNoticeAction` 호출)로 분기한다.
- `components/delete-notice-button.tsx` — 클라이언트 컴포넌트. 클릭 시 `window.confirm('삭제하시겠습니까?')`를 먼저 띄우고, 사용자가 확인을 누른 경우에만 `deleteNoticeAction(id)`를 호출한다.
- `components/admin-nav.tsx` — "예약 신청"/"공지사항" 탭 두 개와 기존 `AdminLogoutButton`을 한 컴포넌트로 묶는다. `usePathname`으로 현재 섹션을 강조 표시한다. `/admin/reservations`와 `/admin/notices` 두 목록 페이지 상단에만 배치하고, 로그인 전 화면(`/admin/login`)에는 넣지 않는다. 기존 `app/admin/reservations/page.tsx`의 헤더 줄(제목 + 로그아웃 버튼)은 이 컴포넌트 호출로 교체한다.

## 데이터 흐름

**생성**: `/admin/notices` 목록의 "새 공지 작성" 링크 → `/admin/notices/new` → `NoticeForm` 제출 → `createNoticeAction` → `createNotice`가 `x-admin-key` 헤더와 함께 `POST /notices` 호출 → `AdminKeyGuard` 통과 → 저장 후 `/admin/notices`로 리다이렉트.

**수정**: 목록의 "수정" 링크 → `/admin/notices/[id]/edit`(서버 컴포넌트가 `getNoticeById`로 기존 값을 불러와 `NoticeForm`에 프리필) → 제출 → `updateNoticeAction` → `PATCH /notices/:id` → 저장 후 `/admin/notices`로 리다이렉트.

**삭제**: 목록의 "삭제" 버튼 클릭 → `confirm()` 통과 → `deleteNoticeAction` → `DELETE /notices/:id` → `revalidatePath('/admin/notices')`로 같은 페이지가 갱신된 목록을 다시 렌더링.

## 에러 처리

- 필수 필드(`title`/`content`) 누락: 백엔드는 기존 `CreateNoticeDto`/`UpdateNoticeDto`의 `class-validator` 규칙(`@IsString()`, `@IsNotEmpty()`)이 전역 `ValidationPipe`를 통해 400을 반환한다. 프런트엔드는 `<Input required>`로 1차 방어한다.
- 인증 실패(헤더 없음/불일치): 기존과 동일하게 `AdminKeyGuard`가 401을 반환한다.
- 존재하지 않는 id로 수정/삭제 시도: `NotFoundException`으로 404를 반환한다.

## 테스트

- **백엔드 유닛 테스트**: `notices.service.spec.ts`에 `update`/`remove` 테스트를 추가한다. 성공 케이스와 존재하지 않는 id 케이스를 기존 mock-repository 패턴으로 검증한다.
- **백엔드 e2e 테스트**: `test/notices.e2e-spec.ts`를 새로 작성한다. 이미 설치되어 있는 `test:e2e` 인프라(`jest` + `supertest` + `@nestjs/testing`, `test/jest-e2e.json`)를 그대로 쓰며, 실제 Nest 앱을 부팅해 HTTP 레벨에서 다음을 검증한다: 관리자 키 없이 `PATCH`/`DELETE` 호출 시 401, 존재하지 않는 id로 호출 시 404, 정상 호출 시 200과 갱신된/삭제된 결과.
- **프런트엔드**: 자동 테스트 프레임워크를 도입하지 않는다. `npx tsc --noEmit`과 개발 서버에서의 수동 확인(생성 → 수정 → 삭제 전체 흐름)으로 대체한다.

## 범위 밖

- 공지사항 읽기 전용 관리자 상세 페이지 — 공개용 `/notices/[id]`가 그 역할을 대신하므로 불필요
- 체험/숙박 콘텐츠 CRUD — 이 스펙에서 확립한 패턴을 재사용해 이후 별도 스펙으로 진행
- 프런트엔드 자동 테스트 프레임워크(Playwright 등) 도입 — 예약/공지 두 관리자 섹션이 갖춰진 뒤 별도 브레인스토밍 세션에서 논의
