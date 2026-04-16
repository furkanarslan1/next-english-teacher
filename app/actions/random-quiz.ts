"use server";

import { createClient } from "@/lib/supabase/server";

type WordCard = { id: string; word: string; translation: string | null };

export type QuizOption = { label: string; is_correct: boolean };
export type QuizQuestion = {
  word_card_id: string;
  question: string;
  options: QuizOption[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(batchWords: WordCard[], pool: WordCard[]): QuizQuestion[] {
  return shuffle(
    batchWords
      .filter((w) => w.translation)
      .map((word) => {
        const distractors = shuffle(
          pool.filter((w) => w.id !== word.id && w.translation),
        )
          .slice(0, 3)
          .map((w) => ({ label: w.translation!, is_correct: false }));

        const options = shuffle([
          { label: word.translation!, is_correct: true },
          ...distractors,
        ]);

        return { word_card_id: word.id, question: word.word, options };
      }),
  );
}

export async function fetchRandomQuizBatch(
  batchIds: string[],
  distractorIds: string[],
): Promise<QuizQuestion[]> {
  if (batchIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("word_cards")
    .select("id, word, translation")
    .in("id", [...batchIds, ...distractorIds])
    .eq("is_active", true);

  if (!data) return [];

  const wordMap = new Map(data.map((w) => [w.id, w]));
  const batchWords = batchIds
    .map((id) => wordMap.get(id))
    .filter(Boolean) as WordCard[];

  return buildQuestions(batchWords, data);
}