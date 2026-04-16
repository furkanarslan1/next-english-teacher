import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { getCachedLevel, getCachedWordCardIds } from "@/lib/data/levels";

const BATCH_SIZE = 10;
const PASS_SCORE = 0.7;

export default async function LevelBatchesPage({
  params,
}: {
  params: Promise<{ level_id: string }>;
}) {
  const { level_id } = await params;

  // Static veriler cache'ten — DB sorgusu yok
  const [level, wordIdRows] = await Promise.all([
    getCachedLevel(level_id),
    getCachedWordCardIds(level_id),
  ]);

  if (!level) notFound();

  // Kullanıcı progressi — kullanıcıya özgü, DB'den taze çek
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: progress } = user
    ? await supabase
        .from("level_quiz_progress")
        .select("batch, score, total")
        .eq("student_id", user.id)
        .eq("level_id", level_id)
    : { data: [] as { batch: number; score: number; total: number }[] };

  const wordCount = wordIdRows.length;
  const totalBatches = Math.max(1, Math.ceil(wordCount / BATCH_SIZE));
  const progressMap = new Map((progress ?? []).map((p) => [p.batch, p]));

  const batches = Array.from({ length: totalBatches }, (_, i) => {
    const batch = i + 1;
    const p = progressMap.get(batch);
    const prevP = progressMap.get(batch - 1);
    const passed = p ? p.score / p.total >= PASS_SCORE : false;
    const locked =
      batch > 1 && !(prevP && prevP.score / prevP.total >= PASS_SCORE);

    return {
      batch,
      wordCount: Math.min(BATCH_SIZE, wordCount - (batch - 1) * BATCH_SIZE),
      score: p?.score,
      total: p?.total,
      passed,
      locked,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/quizzes" className="hover:underline">
              Testler
            </Link>
            <span>/</span>
            <span>{level.label}</span>
          </div>
          <h1 className="text-2xl font-semibold">{level.label} Testleri</h1>
          <p className="text-sm text-muted-foreground">
            {wordCount} kelime · {totalBatches} test
          </p>
        </div>
        {wordCount >= 4 && (
          <Button asChild variant="outline" className="shrink-0">
            <Link href={`/dashboard/quizzes/${level_id}/random`}>
              🎲 Rastgele Test
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map(({ batch, wordCount: wc, score, total, passed, locked }) => (
          <div
            key={batch}
            className={`rounded-xl border p-5 transition-shadow ${
              locked
                ? "bg-muted/40 opacity-60"
                : "bg-card shadow-sm hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">Test {batch}</p>
                <p className="text-sm text-muted-foreground">{wc} kelime</p>
              </div>
              {locked ? (
                <span className="text-lg">🔒</span>
              ) : passed ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Geçti
                </span>
              ) : score !== undefined ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Tekrar
                </span>
              ) : null}
            </div>

            {score !== undefined && (
              <p className="mt-2 text-sm text-muted-foreground">
                Son: {score}/{total} ({Math.round((score / total!) * 100)}%)
              </p>
            )}

            {!locked && (
              <Link
                href={`/dashboard/quizzes/${level_id}/${batch}`}
                className="mt-3 block w-full rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {score !== undefined ? "Tekrar Çöz" : "Başla"}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
