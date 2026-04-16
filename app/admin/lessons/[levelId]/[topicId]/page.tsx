import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionsClient } from "./sections-client";

export default async function AdminLessonSectionsPage({
  params,
}: {
  params: Promise<{ levelId: string; topicId: string }>;
}) {
  const { levelId, topicId } = await params;
  const supabase = await createClient();

  const [{ data: level }, { data: topic }, { data: sections }] =
    await Promise.all([
      supabase.from("levels").select("id, label").eq("id", levelId).single(),
      supabase
        .from("lesson_topics")
        .select("id, title")
        .eq("id", topicId)
        .single(),
      supabase
        .from("lesson_sections")
        .select("id, title, content, is_active, sort_order")
        .eq("topic_id", topicId)
        .order("sort_order"),
    ]);

  if (!level || !topic) notFound();

  return (
    <SectionsClient
      level={level}
      topic={topic}
      sections={sections ?? []}
    />
  );
}