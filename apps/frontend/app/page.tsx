import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNotices, getTideByDate } from "@/lib/api";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "마을소개", href: "/about" },
  { label: "체험 프로그램", href: "/experiences" },
  { label: "숙박", href: "/lodging" },
  { label: "물때정보", href: "/tides" },
];

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home() {
  const today = todayDateString();
  const [todayTide, notices] = await Promise.all([
    getTideByDate(today).catch(() => null),
    getNotices().catch(() => []),
  ]);
  const latestNotices = notices.slice(0, 3);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12">
      <section className="flex h-40 items-end rounded-lg bg-muted p-4 md:h-56">
        <div>
          <h1 className="text-xl font-bold md:text-3xl">
            명사십리 갯벌, 진짜 갯마을 하루
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            전북 고창 장호어촌체험마을
          </p>
        </div>
      </section>

      <a
        href="tel:063-562-9390"
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        ☎ 063-562-9390 전화 문의
      </a>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="items-center text-center transition-colors hover:bg-muted">
              <CardContent className="text-sm font-medium">
                {item.label}
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>오늘의 물때 · {today}</CardTitle>
            <CardAction>
              <Link
                href="/tides"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                전체보기 →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {todayTide ? (
              <table className="w-full text-sm [&_td]:py-1 [&_th]:py-1 [&_th]:text-left [&_th]:text-muted-foreground">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>1회</th>
                    <th>2회</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>만조</td>
                    <td>{todayTide.highTide1Time ?? "-"}</td>
                    <td>{todayTide.highTide2Time ?? "-"}</td>
                  </tr>
                  <tr>
                    <td>간조</td>
                    <td>{todayTide.lowTide1Time ?? "-"}</td>
                    <td>{todayTide.lowTide2Time ?? "-"}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">
                오늘({today}) 등록된 물때 정보가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>공지사항</CardTitle>
            <CardAction>
              <Link
                href="/notices"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                더보기 →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {latestNotices.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {latestNotices.map((notice) => (
                  <li
                    key={notice.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>{notice.title}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                등록된 공지가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
