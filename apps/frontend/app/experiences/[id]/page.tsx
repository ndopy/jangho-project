import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Phone, Users, Wallet } from 'lucide-react';

import { BulletList } from '@/components/bullet-list';
import { InfoPill } from '@/components/info-pill';
import { PriceTable } from '@/components/price-table';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExperienceById } from '@/lib/api';
import { cn } from '@/lib/utils';

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await getExperienceById(Number(id));

  if (!experience) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/experiences"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 체험 프로그램 목록
      </Link>

      <h1 className="mt-3 text-2xl font-bold md:text-3xl">{experience.name}</h1>
      {experience.description && (
        <p className="mt-2 text-muted-foreground">{experience.description}</p>
      )}

      {(experience.price != null ||
        experience.capacity != null ||
        experience.durationMinutes != null) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {experience.price != null && (
            <InfoPill icon={Wallet}>
              {experience.price.toLocaleString()}원부터
            </InfoPill>
          )}
          {experience.capacity != null && (
            <InfoPill icon={Users}>정원 {experience.capacity}명</InfoPill>
          )}
          {experience.durationMinutes != null && (
            <InfoPill icon={Clock}>{experience.durationMinutes}분</InfoPill>
          )}
        </div>
      )}

      {experience.priceOptions && experience.priceOptions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">요금 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceTable options={experience.priceOptions} />
          </CardContent>
        </Card>
      )}

      {experience.notes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">준비물·안내사항</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList text={experience.notes} />
          </CardContent>
        </Card>
      )}

      {(experience.location || experience.contactPhone) && (
        <Card className="mt-4">
          <CardContent className="space-y-3">
            {experience.location && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {experience.location}
              </p>
            )}
            {experience.contactPhone && (
              <a
                href={`tel:${experience.contactPhone}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                )}
              >
                <Phone className="size-4" />
                {experience.contactPhone} 전화 문의
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
