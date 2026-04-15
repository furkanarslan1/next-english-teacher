import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const BATCH_SIZE = 10;
const PASS_SCORE = 0.7; // %70

export default async function StudentQuizzesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: levels }, { data: wordCounts }, { data: progress }] =
    await Promise.all([
      supabase
        .from("levels")
        .select("id, label")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("word_cards")
        .select("level_id")
        .eq("is_active", true),
      user
        ? supabase
            .from("level_quiz_progress")
            .select("level_id, batch, score, total")
            .eq("student_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

  // Her seviye için toplam kelime ve tamamlanan batch sayısı
  const levelStats = (levels ?? []).map((level) => {
    const count = (wordCounts ?? []).filter(
      (w) => w.level_id === level.id,
    ).length;
    const totalBatches = Math.max(1, Math.ceil(count / BATCH_SIZE));

    const levelProgress = (progress ?? []).filter(
      (p) => p.level_id === level.id,
    );
    const completedBatches = levelProgress.filter(
      (p) => p.score / p.total >= PASS_SCORE,
    ).length;

    return { ...level, count, totalBatches, completedBatches };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Testler</h1>
        <p className="text-sm text-muted-foreground">
          Seviye seç ve kelime testine başla.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levelStats.map((level) => {
          const pct =
            level.totalBatches > 0
              ? Math.round((level.completedBatches / level.totalBatches) * 100)
              : 0;

          return (
            <Link
              key={level.id}
              href={`/dashboard/quizzes/${level.id}`}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold">{level.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {level.count} kelime · {level.totalBatches} test
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {level.completedBatches} / {level.totalBatches} tamamlandı
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
