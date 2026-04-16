import Link from "next/link";
import { getCachedActiveLevels, getCachedWordCountsByLevel } from "@/lib/data/levels";

export default async function StudentCardsPage() {
  const [levels, countMap] = await Promise.all([
    getCachedActiveLevels(),
    getCachedWordCountsByLevel(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Kelime Kartları</h1>
        <p className="text-sm text-muted-foreground">
          Çalışmak istediğin seviyeyi seç.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => {
          const count = countMap.get(level.id) ?? 0;
          return (
            <Link
              key={level.id}
              href={`/dashboard/cards/${level.id}`}
              className={`group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
                count === 0 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <p className="text-3xl font-bold">{level.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {count > 0 ? `${count} kelime` : "Henüz kart eklenmemiş"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}