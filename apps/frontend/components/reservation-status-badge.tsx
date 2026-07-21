import type { ReservationStatus } from '@/lib/api';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: '대기',
  confirmed: '확인',
  hold: '보류',
};

const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  confirmed:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  hold: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
};

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
