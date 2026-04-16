import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopicsClient } from "./topics-client";

export default async function AdminLessonTopicsPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const supabase = await createClient();

  const [{ data: level }, { data: topics }] = await Promise.all([
    supabase.from("levels").select("id, label").eq("id", levelId).single(),
    supabase
      .from("lesson_topics")
      .select("id, title, is_active, sort_order")
      .eq("level_id", levelId)
      .order("sort_order"),
  ]);

  if (!level) notFound();

  return <TopicsClient level={level} topics={topics ?? []} />;
}
