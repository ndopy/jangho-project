import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NEARBY_ATTRACTIONS = [
  {
    name: '구시포해수욕장',
    location: '고창군 상하면 자룡리',
    description:
      '명사십리와 이어지는 백사장 해변으로, 빨간 등대와 하얀 등대가 마주 보고 서 있어 노을 무렵 풍경이 아름답기로 알려져 있습니다.',
  },
  {
    name: '동호해수욕장',
    location: '고창군 상하면',
    description:
      '명사십리 해안선의 반대편 끝에 있는 해변으로, 구시포해수욕장과 함께 이 일대 해안선을 이룹니다.',
  },
  {
    name: '선운사·선운산도립공원',
    location: '고창군 아산면',
    description:
      '천년 고찰 선운사를 품은 도립공원으로, 가을철 꽃무릇 군락으로 특히 잘 알려진 고창의 대표 명소입니다.',
  },
  {
    name: '고창읍성(모양성)',
    location: '고창군 고창읍',
    description:
      '조선시대에 쌓은 읍성으로, 사적으로 지정되어 있습니다. 성곽을 따라 한 바퀴 도는 답성놀이로도 유명합니다.',
  },
  {
    name: '고창 고인돌 유적',
    location: '고창군 고창읍 죽림리',
    description:
      '동아시아 최대 규모의 고인돌 밀집 지역 중 하나로, 2000년 유네스코 세계문화유산으로 지정되었습니다.',
  },
  {
    name: '학원농장',
    location: '고창군 공음면',
    description:
      '봄 청보리밭과 가을 메밀꽃밭으로 유명한 관광농원으로, 계절마다 다른 풍경을 볼 수 있습니다.',
  },
];

export default function NearbyAttractionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold md:text-3xl">주변관광지</h1>
      <p className="mt-2 text-muted-foreground">
        장호어촌체험마을에서 차로 이동할 수 있는 고창군 내 주요 관광지입니다.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {NEARBY_ATTRACTIONS.map((attraction) => (
          <Card key={attraction.name}>
            <CardHeader>
              <CardTitle className="text-base">{attraction.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {attraction.location}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {attraction.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
