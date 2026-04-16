import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// ─── Lesson Topics (level bazlı) ─────────────────────────────────────────────

const _getCachedLessonTopics = unstable_cache(
  async (level_id: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("lesson_topics")
      .select("id, title, sort_order")
      .eq("level_id", level_id)
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["lesson-topics"],
  { tags: ["lesson-topics"], revalidate: 3600 },
);

export const getCachedLessonTopics = (level_id: string) =>
  _getCachedLessonTopics(level_id);

// ─── Lesson Topic (tek konu) ──────────────────────────────────────────────────

const _getCachedLessonTopic = unstable_cache(
  async (topic_id: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("lesson_topics")
      .select("id, title, level_id")
      .eq("id", topic_id)
      .eq("is_active", true)
      .single();
    return data ?? null;
  },
  ["lesson-topic"],
  { tags: ["lesson-topics"], revalidate: 3600 },
);

export const getCachedLessonTopic = (topic_id: string) =>
  _getCachedLessonTopic(topic_id);

// ─── Lesson Sections (topic bazlı) ────────────────────────────────────────────

const _getCachedLessonSections = unstable_cache(
  async (topic_id: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("lesson_sections")
      .select("id, title, content, sort_order")
      .eq("topic_id", topic_id)
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["lesson-sections"],
  { tags: ["lesson-sections"], revalidate: 3600 },
);

export const getCachedLessonSections = (topic_id: string) =>
  _getCachedLessonSections(topic_id);

// ─── Topic sayısı (level listesi için) ───────────────────────────────────────

const _getCachedTopicCountsByLevel = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("lesson_topics")
      .select("level_id")
      .eq("is_active", true);

    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      map[row.level_id] = (map[row.level_id] ?? 0) + 1;
    }
    return map;
  },
  ["lesson-topic-counts"],
  { tags: ["lesson-topics"], revalidate: 3600 },
);

export const getCachedTopicCountsByLevel = () =>
  _getCachedTopicCountsByLevel();
