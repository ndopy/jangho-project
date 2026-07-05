'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DESKTOP_NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="text-base font-bold md:text-lg">
          장호어촌체험마을
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground',
                  active && 'font-semibold text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
