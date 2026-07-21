import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservationStatusBadge } from '@/components/reservation-status-badge';
import { Button } from '@/components/ui/button';
import { updateReservationStatusAction } from '@/lib/actions';
import { getReservationById } from '@/lib/api';

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservationById(Number(id));

  if (!reservation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link
        href="/admin/reservations"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 예약 신청 목록
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{reservation.itemName}</h1>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <div className="mt-4 flex gap-2">
        <form
          action={updateReservationStatusAction.bind(
            null,
            reservation.id,
            'confirmed',
          )}
        >
          <Button type="submit" size="sm">
            확인으로 변경
          </Button>
        </form>
        <form
          action={updateReservationStatusAction.bind(
            null,
            reservation.id,
            'hold',
          )}
        >
          <Button type="submit" variant="outline" size="sm">
            보류로 변경
          </Button>
        </form>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">희망 날짜</dt>
          <dd>{reservation.desiredDate}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">인원</dt>
          <dd>{reservation.peopleCount}명</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">신청자</dt>
          <dd>{reservation.applicantName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">연락처</dt>
          <dd>{reservation.applicantPhone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">신청일</dt>
          <dd>
            {new Date(reservation.createdAt).toLocaleDateString('ko-KR')}
          </dd>
        </div>
        {reservation.message && (
          <div>
            <dt className="text-muted-foreground">요청사항</dt>
            <dd className="mt-1 whitespace-pre-line">
              {reservation.message}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
