import Link from "next/link";
import { Clock, MapPin, Users, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExperiences } from "@/lib/api";

export default async function ExperiencesPage() {
  const experiences = await getExperiences().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold">체험 프로그램</h1>

      {experiences.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          등록된 체험 프로그램이 없습니다.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {experiences.map((experience) => (
            <Link key={experience.id} href={`/experiences/${experience.id}`}>
              <Card className="h-full transition-colors hover:bg-muted">
                <CardHeader>
                  <CardTitle>{experience.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {experience.price != null && (
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="size-3.5" />
                        {experience.price.toLocaleString()}원부터
                      </span>
                    )}
                    {experience.capacity != null && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        정원 {experience.capacity}명
                      </span>
                    )}
                    {experience.durationMinutes != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {experience.durationMinutes}분
                      </span>
                    )}
                  </div>
                  {experience.location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {experience.location}
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
