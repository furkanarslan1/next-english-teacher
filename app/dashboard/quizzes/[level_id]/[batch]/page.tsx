import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizSession } from "./quiz-session";
import { getCachedLevel, getCachedWordCardIds } from "@/lib/data/levels";

const BATCH_SIZE = 10;
const TIME_PER_QUESTION = 15;

type WordCard = { id: string; word: string; translation: string | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(batchWords: WordCard[], allWords: WordCard[]) {
  return batchWords
    .filter((w) => w.translation)
    .map((word) => {
      const distractors = shuffle(
        allWords.filter((w) => w.id !== word.id && w.translation),
      )
        .slice(0, 3)
        .map((w) => ({ label: w.translation!, is_correct: false }));

      const options = shuffle([
        { label: word.translation!, is_correct: true },
        ...distractors,
      ]);

      return { word_card_id: word.id, question: word.word, options };
    });
}

export default async function QuizBatchPage({
  params,
}: {
  params: Promise<{ level_id: string; batch: string }>;
}) {
  const { level_id, batch: batchParam } = await params;
  const batch = parseInt(batchParam, 10);

  if (isNaN(batch) || batch < 1) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Static veriler cache'ten — DB sorgusu yok
  const [level, allIdRows] = await Promise.all([
    getCachedLevel(level_id),
    getCachedWordCardIds(level_id),
  ]);

  if (!level) notFound();

  const from = (batch - 1) * BATCH_SIZE;
  const batchIds = allIdRows.slice(from, from + BATCH_SIZE).map((r) => r.id);

  if (batchIds.length === 0) notFound();

  // Kilit kontrolü — kullanıcıya özgü, DB'den taze çek
  if (batch > 1) {
    const { data: prevProgress } = await supabase
      .from("level_quiz_progress")
      .select("score, total")
      .eq("student_id", user.id)
      .eq("level_id", level_id)
      .eq("batch", batch - 1)
      .single();

    const prevPassed =
      prevProgress && prevProgress.score / prevProgress.total >= 0.7;
    if (!prevPassed) redirect(`/dashboard/quizzes/${level_id}`);
  }

  // Distractor havuzu + batch kelimelerini tek sorguda çek
  const batchIdSet = new Set(batchIds);
  const distractorPool = shuffle(
    allIdRows.filter((r) => !batchIdSet.has(r.id)).map((r) => r.id),
  ).slice(0, 30);

  const { data: fetchedWords } = await supabase
    .from("word_cards")
    .select("id, word, translation")
    .in("id", [...batchIds, ...distractorPool])
    .eq("is_active", true);

  if (!fetchedWords) notFound();

  const wordMap = new Map(fetchedWords.map((w) => [w.id, w]));
  const batchWords = batchIds
    .map((id) => wordMap.get(id))
    .filter(Boolean) as WordCard[];

  const questions = shuffle(generateQuestions(batchWords, fetchedWords));

  if (questions.length === 0) notFound();

  return (
    <QuizSession
      levelId={level_id}
      levelLabel={level.label}
      batch={batch}
      questions={questions}
      timePerQuestion={TIME_PER_QUESTION}
    />
  );
}
