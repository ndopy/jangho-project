'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MOBILE_TAB_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden">
      {MOBILE_TAB_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground',
              active && 'font-medium text-primary',
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
