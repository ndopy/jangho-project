import { getNotices } from "@/lib/api";

export default async function NoticesPage() {
  const notices = await getNotices().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">공지사항</h1>

      {notices.length === 0 ? (
        <p className="mt-3 text-muted-foreground">등록된 공지가 없습니다</p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {notices.map((notice) => (
            <li key={notice.id} className="py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{notice.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {notice.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
