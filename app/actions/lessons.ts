"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lessonTopicSchema, lessonSectionSchema } from "@/lib/schemas/lessons";

export type LessonActionResult = { error?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, error: "Yetkisiz erişim." };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) return { supabase: null, error: "Yetkisiz erişim." };

  return { supabase, error: null };
}

// ─── LESSON TOPICS ────────────────────────────────────────────────────────────

export async function createLessonTopicAction(
  values: unknown,
): Promise<LessonActionResult> {
  const parsed = lessonTopicSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { data: maxRow } = await supabase
    .from("lesson_topics")
    .select("sort_order")
    .eq("level_id", parsed.data.level_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 10;

  const { error } = await supabase.from("lesson_topics").insert({
    title: parsed.data.title,
    level_id: parsed.data.level_id,
    sort_order: nextSortOrder,
    is_active: parsed.data.is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-topics", { expire: 0 });
  return {};
}

export async function updateLessonTopicAction(
  id: string,
  values: unknown,
): Promise<LessonActionResult> {
  const parsed = lessonTopicSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("lesson_topics")
    .update({
      title: parsed.data.title,
      level_id: parsed.data.level_id,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-topics", { expire: 0 });
  return {};
}

export async function deleteLessonTopicAction(
  id: string,
): Promise<LessonActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("lesson_topics").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-topics", { expire: 0 });
  return {};
}

// ─── LESSON SECTIONS ──────────────────────────────────────────────────────────

export async function createLessonSectionAction(
  topicId: string,
  values: unknown,
): Promise<LessonActionResult> {
  const parsed = lessonSectionSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { data: maxRow } = await supabase
    .from("lesson_sections")
    .select("sort_order")
    .eq("topic_id", topicId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 10;

  const { error } = await supabase.from("lesson_sections").insert({
    topic_id: topicId,
    title: parsed.data.title,
    content: parsed.data.content,
    sort_order: nextSortOrder,
    is_active: parsed.data.is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-sections", { expire: 0 });
  return {};
}

export async function updateLessonSectionAction(
  id: string,
  topicId: string,
  values: unknown,
): Promise<LessonActionResult> {
  const parsed = lessonSectionSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("lesson_sections")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", id)
    .eq("topic_id", topicId);

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-sections", { expire: 0 });
  return {};
}

export async function deleteLessonSectionAction(
  id: string,
  topicId: string,
): Promise<LessonActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("lesson_sections")
    .delete()
    .eq("id", id)
    .eq("topic_id", topicId);

  if (error) return { error: error.message };

  revalidatePath("/admin/lessons", "layout");
  revalidateTag("lesson-sections", { expire: 0 });
  return {};
}