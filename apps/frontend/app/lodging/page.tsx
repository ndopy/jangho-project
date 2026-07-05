import Link from 'next/link';
import { MapPin, Users, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccommodations } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = {
  pension: '펜션',
  minbak: '민박',
};

export default async function LodgingPage() {
  const accommodations = await getAccommodations().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">숙박</h1>

      {accommodations.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          등록된 숙박시설이 없습니다.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {accommodations.map((accommodation) => (
            <Link key={accommodation.id} href={`/lodging/${accommodation.id}`}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardHeader>
                  <CardTitle>{accommodation.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {TYPE_LABEL[accommodation.type] ?? accommodation.type}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {accommodation.price != null && (
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="size-3.5" />
                        {accommodation.price.toLocaleString()}원부터
                      </span>
                    )}
                    {(accommodation.capacityMin != null ||
                      accommodation.capacityMax != null) && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {accommodation.capacityMin ?? '?'}~
                        {accommodation.capacityMax ?? '?'}인
                      </span>
                    )}
                  </div>
                  {accommodation.location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {accommodation.location}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
