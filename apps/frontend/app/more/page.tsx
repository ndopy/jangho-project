import Link from 'next/link';

import { MORE_LINKS } from '@/lib/nav';

export default function MorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">더보기</h1>
      <ul className="mt-4 divide-y divide-border">
        {MORE_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block py-3 text-sm hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
