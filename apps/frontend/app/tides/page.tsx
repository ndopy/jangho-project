import { getTides } from "@/lib/api";

export default async function TidesPage() {
  const tides = await getTides().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">물때정보</h1>

      {tides.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          등록된 물때 정보가 없습니다.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-120 text-sm [&_td]:py-2 [&_th]:py-2 [&_th]:text-left [&_th]:text-muted-foreground">
            <thead>
              <tr className="border-b border-border">
                <th>날짜</th>
                <th>만조 1회</th>
                <th>만조 2회</th>
                <th>간조 1회</th>
                <th>간조 2회</th>
              </tr>
            </thead>
            <tbody>
              {tides.map((tide) => (
                <tr key={tide.id} className="border-b border-border">
                  <td>{tide.date}</td>
                  <td>{tide.highTide1Time ?? "-"}</td>
                  <td>{tide.highTide2Time ?? "-"}</td>
                  <td>{tide.lowTide1Time ?? "-"}</td>
                  <td>{tide.lowTide2Time ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
