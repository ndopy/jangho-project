import { Bus, Car, MapPin, Phone } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DirectionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold md:text-3xl">오시는길</h1>

      <Card className="mt-4">
        <CardContent className="space-y-3">
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            전북 고창군 상하면 명사십리로 282-42
          </p>
          <a
            href="tel:063-562-9390"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Phone className="size-4" />
            063-562-9390 전화 문의
          </a>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="size-4" />
            자가용 이용 시
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            서해안고속도로 선운산IC에서 나와 지방도를 타고 고창군 상하면
            방면으로 이동하면 도착합니다. 내비게이션에는 주소(&lsquo;전북 고창군
            상하면 명사십리로 282-42&rsquo;) 또는
            &lsquo;고창장호어촌체험휴양마을&rsquo;을 입력하세요.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bus className="size-4" />
            대중교통 이용 시
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            고창공용(문화)버스터미널까지 시외버스로 이동한 뒤, 상하면·구시포
            방면 농어촌버스로 환승합니다. 농어촌버스는 배차 간격이 넓고 계절에
            따라 시간표가 바뀔 수 있으니, 방문 전 마을(063-562-9390) 또는
            고창군에 미리 확인하시길 권장합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
