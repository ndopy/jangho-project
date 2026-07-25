# 관리자 Server Action 자체 인가 검사

## 배경 / 문제

`apps/frontend/middleware.ts`는 `/admin/*` 페이지 접근을 세션 쿠키로 보호하지만, `apps/frontend/lib/actions.ts`의 관리자 전용 Server Action(`updateReservationStatusAction`, `createNoticeAction`, `updateNoticeAction`, `deleteNoticeAction`)은 이 검사에 전혀 관여하지 않고 미들웨어에만 의존한다. Next.js의 Server Action은 페이지 라우팅과 별개의 엔드포인트라서, 세션이 만료된 상태나 액션을 직접 호출하는 크래프팅된 요청은 미들웨어의 페이지 보호를 거치지 않는다. 오늘 진행한 관리자 패널 3단계(공지사항 CRUD) 최종 코드 리뷰에서 나온 지적이며, 이번에 파괴적(DELETE) 액션이 처음 추가되면서 우선순위가 올라갔다.

## 범위

- 위 4개 관리자 전용 Server Action에 자체 세션 검사를 추가한다.
- `loginAdmin`(로그인 전 단계), `logoutAdmin`(세션이 깨져 있어도 쿠키 삭제는 항상 성공해야 함), `submitReservation`(공개 예약 폼용, 관리자 전용 아님)은 대상에서 제외한다.
- 체험/숙박 CRUD가 추가되면 그쪽의 관리자 액션에도 동일한 헬퍼를 재사용할 것을 전제로 설계한다.

## 설계

`apps/frontend/lib/actions.ts`에 비공개 헬퍼를 추가한다:

```typescript
async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    throw new Error('관리자 인증이 필요합니다.');
  }
}
```

이 헬퍼를 `lib/session.ts`가 아니라 `lib/actions.ts`에 두는 이유는, `lib/session.ts`를 Edge 런타임에서 도는 `middleware.ts`도 import해서 쓰기 때문이다. `next/headers`의 `cookies()`를 쓰는 함수를 같은 파일에 추가하면 미들웨어의 Edge 번들에 불필요한 위험을 보탤 수 있다. `lib/actions.ts`는 이미 `'use server'` + `cookies()`를 쓰고 있으므로 여기 두는 게 안전하다.

`verifySessionToken`(`lib/session.ts`, 이미 존재)을 import해서 재사용하고, 4개 액션 각각의 첫 줄에 `await requireAdminSession();`을 추가한다.

## 에러 처리

검사에 실패하면 `redirect()` 없이 단순 `Error`를 던진다.

- `createNoticeAction`/`updateNoticeAction`/`deleteNoticeAction`은 이미 클라이언트(`notice-form.tsx`, `delete-notice-button.tsx`)에서 `try/catch`로 감싸 호출하므로, 기존 에러 메시지 표시 경로로 자연스럽게 흡수된다.
- `updateReservationStatusAction`은 네이티브 `<form action={...}>`로 호출된다. 여기서 `redirect()`를 쓰면 공지사항 작업 때 실제로 겪었던 문제(호출부의 `try/catch`가 `NEXT_REDIRECT`를 삼켜버리는 문제)가 재발할 수 있어 쓰지 않는다. 세션 만료 상태로 상태 변경 버튼을 누르는 경우는 극히 드물고, 이 경로에서는 Next.js 기본 에러 화면이 뜨는 정도로 충분하다고 판단한다. 페이지 자체는 이미 미들웨어가 보호하므로, 이 검사는 액션이 직접 호출되는 경우에 대비한 2차 방어선이다.

## 테스트

프런트엔드에 자동 테스트 프레임워크가 없다는 기존 결정을 따른다. 수동 확인 항목:

1. 정상 로그인 상태에서 4개 액션(예약 상태 변경, 공지 생성/수정/삭제)이 기존과 동일하게 동작하는지 확인한다.
2. 세션 쿠키를 지운 상태(개발자 도구로 쿠키 삭제 후, 이미 열려 있는 폼에서 제출 시도)에서 각 액션이 에러로 막히는지 확인한다.

## 범위 밖

- `loginAdmin`/`logoutAdmin`/`submitReservation`에는 적용하지 않는다.
- 체험/숙박 콘텐츠 CRUD가 생기면 그쪽 액션에도 `requireAdminSession()`을 재사용하되, 이번 스펙 범위에는 포함하지 않는다.
