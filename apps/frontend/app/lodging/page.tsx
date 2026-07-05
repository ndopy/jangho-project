import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccommodations } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  pension: "펜션",
  minbak: "민박",
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
            <Card key={accommodation.id}>
              <CardHeader>
                <CardTitle>{accommodation.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {TYPE_LABEL[accommodation.type] ?? accommodation.type}
                  {(accommodation.capacityMin != null ||
                    accommodation.capacityMax != null) &&
                    ` · ${accommodation.capacityMin ?? "?"}~${accommodation.capacityMax ?? "?"}인`}
                </p>
                {accommodation.location && <p>{accommodation.location}</p>}
                {accommodation.contactPhone && (
                  <p>☎ {accommodation.contactPhone}</p>
                )}
                {accommodation.price != null && (
                  <p>{accommodation.price.toLocaleString()}원</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
