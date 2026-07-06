import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

import { BulletList } from '@/components/bullet-list';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const EXPERIENCE_HIGHLIGHTS = `노랑조개·동죽·백합·맛조개 등 갯벌 조개 캐기
경운기를 개조한 갯벌버스 드라이브
후릿그물·어망·새우잡이 체험
조개껍질 꾸미기로 나만의 기념품 만들기`;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold md:text-3xl">마을소개</h1>

      <p className="mt-4 leading-relaxed text-muted-foreground">
        장호어촌체험마을은 전북 고창군 상하면, 구시포해수욕장과 동호해수욕장
        사이에 자리한 작은 갯마을입니다. 곱고 넓은 백사장이 4km 가량 이어져
        &lsquo;고창의 명사십리&rsquo;라 불리는 이 해변을 따라, 마을 주민들이
        직접 갯벌 체험 프로그램을 운영하고 있습니다.
      </p>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        물때에 맞춰 갯벌이 드러나면 조개를 캐고, 후릿그물로 고기를 몰아 잡는
        전통 어법을 체험할 수 있어 아이와 함께하는 가족 여행지로도 알려져
        있습니다.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">체험 프로그램 미리보기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BulletList text={EXPERIENCE_HIGHLIGHTS} />
          <Link
            href="/experiences"
            className="inline-block text-sm text-primary hover:underline"
          >
            체험 프로그램 전체 보기 →
          </Link>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="space-y-3">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
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
    </div>
  );
}
