import { AdminNav } from '@/components/admin-nav';
import { NoticeForm } from '@/components/notice-form';

export default function AdminNewNoticePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold">새 공지 작성</h1>
      <div className="mt-6">
        <NoticeForm />
      </div>
    </div>
  );
}
