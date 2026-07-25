import { notFound } from 'next/navigation';

import { AdminNav } from '@/components/admin-nav';
import { NoticeForm } from '@/components/notice-form';
import { getNoticeById } from '@/lib/api';

export default async function AdminEditNoticePage({
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
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold">공지사항 수정</h1>
      <div className="mt-6">
        <NoticeForm
          noticeId={notice.id}
          initialValues={{ title: notice.title, content: notice.content }}
        />
      </div>
    </div>
  );
}
