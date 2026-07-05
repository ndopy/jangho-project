import { getMudflatForecasts } from "@/lib/api";

export default async function TidesPage() {
  const forecasts = await getMudflatForecasts().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">물때정보</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        고창 장호 지역 자체 데이터가 아직 없어, 같은 곰소만 인근{" "}
        {forecasts[0]?.villageName ?? "만돌마을"} 기준 갯벌체험지수를
        참고용으로 보여드립니다.
      </p>

      {forecasts.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          등록된 물때 정보가 없습니다.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-120 text-sm [&_td]:py-2 [&_th]:py-2 [&_th]:text-left [&_th]:text-muted-foreground">
            <thead>
              <tr className="border-b border-border">
                <th>날짜</th>
                <th>체험 가능 시간</th>
                <th>지수</th>
                <th>날씨</th>
                <th>기온</th>
                <th>풍속</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast) => (
                <tr key={forecast.id} className="border-b border-border">
                  <td>{forecast.date}</td>
                  <td>
                    {forecast.experienceStartTime && forecast.experienceEndTime
                      ? `${forecast.experienceStartTime.slice(0, 5)}~${forecast.experienceEndTime.slice(0, 5)}`
                      : "-"}
                  </td>
                  <td>{forecast.totalIndex}</td>
                  <td>{forecast.weather ?? "-"}</td>
                  <td>
                    {forecast.minTemperature != null &&
                    forecast.maxTemperature != null
                      ? `${forecast.minTemperature}~${forecast.maxTemperature}℃`
                      : "-"}
                  </td>
                  <td>
                    {forecast.minWindSpeed != null &&
                    forecast.maxWindSpeed != null
                      ? `${forecast.minWindSpeed}~${forecast.maxWindSpeed}m/s`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
