import { notFound } from "next/navigation";
import { fetchRandomQuizBatch } from "@/app/actions/random-quiz";
import { RandomQuizSession } from "./random-quiz";
import { getCachedLevel, getCachedWordCardIds } from "@/lib/data/levels";

const BATCH_SIZE = 10;
const DISTRACTOR_POOL = 30;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function RandomQuizPage({
  params,
}: {
  params: Promise<{ level_id: string }>;
}) {
  const { level_id } = await params;

  // Static veriler cache'ten — DB sorgusu yok
  const [level, idRows] = await Promise.all([
    getCachedLevel(level_id),
    getCachedWordCardIds(level_id),
  ]);

  if (!level) notFound();

  const allIds = shuffle(idRows.map((r) => r.id));

  if (allIds.length < 4) notFound();

  const batchIds = allIds.slice(0, BATCH_SIZE);
  const remainingIds = allIds.slice(BATCH_SIZE);
  const distractorIds = remainingIds.slice(0, DISTRACTOR_POOL);

  // İlk batch'in tam verisini çek (tek gerçek DB sorgusu)
  const initialQuestions = await fetchRandomQuizBatch(batchIds, distractorIds);

  if (initialQuestions.length === 0) notFound();

  return (
    <RandomQuizSession
      levelId={level_id}
      levelLabel={level.label}
      initialQuestions={initialQuestions}
      remainingIds={remainingIds}
    />
  );
}
