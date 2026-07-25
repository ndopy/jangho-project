import Link from 'next/link';

import { AdminNav } from '@/components/admin-nav';
import { DeleteNoticeButton } from '@/components/delete-notice-button';
import { Button } from '@/components/ui/button';
import { getNotices } from '@/lib/api';

export default async function AdminNoticesPage() {
  const notices = await getNotices();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <AdminNav />

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <Button render={<Link href="/admin/notices/new">새 공지 작성</Link>} />
      </div>

      {notices.length === 0 ? (
        <p className="mt-6 text-muted-foreground">등록된 공지가 없습니다</p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm"
            >
              <span className="font-medium">{notice.title}</span>
              <span className="text-muted-foreground">
                {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/admin/notices/${notice.id}/edit`}>수정</Link>
                  }
                />
                <DeleteNoticeButton id={notice.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
