import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionsClient } from "./questions-client";

export default async function AdminQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quiz }, { data: questions }, { data: levels }] =
    await Promise.all([
      supabase
        .from("quizzes")
        .select("id, title, time_per_question")
        .eq("id", id)
        .single(),
      supabase
        .from("questions")
        .select(
          "id, type, question_text, options, word_card_id, question_direction, points, sort_order",
        )
        .eq("quiz_id", id)
        .order("sort_order"),
      supabase.from("levels").select("id, label").order("sort_order"),
    ]);

  if (!quiz) notFound();

  return (
    <QuestionsClient
      quiz={quiz}
      questions={questions ?? []}
      levels={levels ?? []}
    />
  );
}
