import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Phone, Users, Wallet } from "lucide-react";

import { BulletList } from "@/components/bullet-list";
import { InfoPill } from "@/components/info-pill";
import { PriceTable } from "@/components/price-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccommodationById } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  pension: "펜션",
  minbak: "민박",
};

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accommodation = await getAccommodationById(Number(id));

  if (!accommodation) {
    notFound();
  }

  const amenityList =
    accommodation.amenities
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/lodging"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 숙박 목록
      </Link>

      <h1 className="mt-3 text-2xl font-bold md:text-3xl">
        {accommodation.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {TYPE_LABEL[accommodation.type] ?? accommodation.type}
      </p>
      {accommodation.description && (
        <p className="mt-2 text-muted-foreground">
          {accommodation.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {accommodation.price != null && (
          <InfoPill icon={Wallet}>
            {accommodation.price.toLocaleString()}원부터
          </InfoPill>
        )}
        {(accommodation.capacityMin != null ||
          accommodation.capacityMax != null) && (
          <InfoPill icon={Users}>
            {accommodation.capacityMin ?? "?"}~{accommodation.capacityMax ?? "?"}
            인
          </InfoPill>
        )}
        {accommodation.checkInTime && (
          <InfoPill icon={Clock}>입실 {accommodation.checkInTime}</InfoPill>
        )}
        {accommodation.checkOutTime && (
          <InfoPill icon={Clock}>퇴실 {accommodation.checkOutTime}</InfoPill>
        )}
      </div>

      {accommodation.priceOptions && accommodation.priceOptions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">요금 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceTable options={accommodation.priceOptions} />
          </CardContent>
        </Card>
      )}

      {amenityList.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">편의시설</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenityList.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {accommodation.houseRules && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">유의사항</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList text={accommodation.houseRules} />
          </CardContent>
        </Card>
      )}

      {(accommodation.location || accommodation.contactPhone) && (
        <Card className="mt-4">
          <CardContent className="space-y-3">
            {accommodation.location && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {accommodation.location}
              </p>
            )}
            {accommodation.contactPhone && (
              <a
                href={`tel:${accommodation.contactPhone}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Phone className="size-4" />
                {accommodation.contactPhone} 전화 문의
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
