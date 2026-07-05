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
            <Card key={experience.id}>
              <CardHeader>
                <CardTitle>{experience.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {experience.description && <p>{experience.description}</p>}
                {experience.location && <p>{experience.location}</p>}
                {experience.contactPhone && (
                  <p>☎ {experience.contactPhone}</p>
                )}
                {(experience.price != null ||
                  experience.capacity != null ||
                  experience.durationMinutes != null) && (
                  <p>
                    {experience.price != null &&
                      `${experience.price.toLocaleString()}원`}
                    {experience.capacity != null &&
                      ` · 정원 ${experience.capacity}명`}
                    {experience.durationMinutes != null &&
                      ` · ${experience.durationMinutes}분`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
