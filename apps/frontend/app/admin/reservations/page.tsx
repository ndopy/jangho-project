import Link from 'next/link';

import { AdminNav } from '@/components/admin-nav';
import { ReservationStatusBadge } from '@/components/reservation-status-badge';
import { getReservations } from '@/lib/api';

export default async function AdminReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <AdminNav />

      <h1 className="mt-6 text-2xl font-bold">예약 신청 목록</h1>

      {reservations.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          접수된 예약 신청이 없습니다
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <Link
                href={`/admin/reservations/${reservation.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm transition-colors hover:text-primary"
              >
                <span className="text-muted-foreground">
                  {new Date(reservation.createdAt).toLocaleDateString(
                    'ko-KR',
                  )}
                </span>
                <span className="font-medium">{reservation.itemName}</span>
                <span className="text-muted-foreground">
                  {reservation.applicantName}
                </span>
                <span className="text-muted-foreground">
                  {reservation.applicantPhone}
                </span>
                <ReservationStatusBadge status={reservation.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
