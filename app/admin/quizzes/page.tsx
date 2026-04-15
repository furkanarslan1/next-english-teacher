import { createClient } from "@/lib/supabase/server";
import { QuizzesClient } from "./quizzes-client";

export default async function AdminQuizzesPage() {
  const supabase = await createClient();

  const [
    { data: quizzes },
    { data: levels },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("quizzes")
      .select(
        "id, title, description, time_per_question, is_active, sort_order, quiz_levels(level_id, levels(label)), quiz_categories(category_id, categories(label))",
      )
      .order("sort_order"),
    supabase.from("levels").select("id, label").order("sort_order"),
    supabase
      .from("categories")
      .select("id, label, level_id")
      .order("sort_order"),
  ]);

  return (
    <QuizzesClient
      quizzes={quizzes ?? []}
      levels={levels ?? []}
      categories={categories ?? []}
    />
  );
}
