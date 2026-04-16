import Link from "next/link";
import { getCachedActiveLevels } from "@/lib/data/levels";
import { getCachedTopicCountsByLevel } from "@/lib/data/lessons";

export default async function StudentLessonsPage() {
  const [levels, countMap] = await Promise.all([
    getCachedActiveLevels(),
    getCachedTopicCountsByLevel(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dersler</h1>
        <p className="text-sm text-muted-foreground">
          Çalışmak istediğin seviyeyi seç.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => {
          const count = countMap[level.id] ?? 0;
          return (
            <Link
              key={level.id}
              href={`/dashboard/lessons/${level.id}`}
              className={`group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
                count === 0 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <p className="text-3xl font-bold">{level.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {count > 0 ? `${count} konu` : "Henüz ders eklenmemiş"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
