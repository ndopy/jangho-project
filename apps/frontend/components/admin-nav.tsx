'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AdminLogoutButton } from '@/components/admin-logout-button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/reservations', label: '예약 신청' },
  { href: '/admin/notices', label: '공지사항' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between">
      <nav className="flex gap-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <AdminLogoutButton />
    </div>
  );
}
