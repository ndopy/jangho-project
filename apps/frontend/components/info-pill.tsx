import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function InfoPill({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
