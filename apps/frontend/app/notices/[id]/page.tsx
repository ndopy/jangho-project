import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getNoticeById } from '@/lib/api';

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(Number(id));

  if (!notice) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/notices"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 공지사항 목록
      </Link>

      <h1 className="mt-3 text-2xl font-bold md:text-3xl">{notice.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
      </p>

      <p className="mt-6 leading-relaxed whitespace-pre-line">
        {notice.content}
      </p>
    </div>
  );
}
