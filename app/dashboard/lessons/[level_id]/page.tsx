import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedLevel } from "@/lib/data/levels";
import { getCachedLessonTopics } from "@/lib/data/lessons";

export default async function StudentLessonTopicsPage({
  params,
}: {
  params: Promise<{ level_id: string }>;
}) {
  const { level_id } = await params;

  const [level, topics] = await Promise.all([
    getCachedLevel(level_id),
    getCachedLessonTopics(level_id),
  ]);

  if (!level) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard/lessons" className="hover:underline">
            Dersler
          </Link>
          <span>/</span>
          <span>{level.label}</span>
        </div>
        <h1 className="text-2xl font-semibold">{level.label} — Konular</h1>
        <p className="text-sm text-muted-foreground">
          Okumak istediğin konuyu seç.
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-muted-foreground">
          Bu seviyeye henüz ders eklenmemiş.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic, idx) => (
            <Link
              key={topic.id}
              href={`/dashboard/lessons/${level_id}/${topic.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {idx + 1}
              </span>
              <span className="font-medium">{topic.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}