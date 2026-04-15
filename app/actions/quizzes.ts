"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quizSchema } from "@/lib/schemas/quizzes";

export type QuizActionResult = { error?: string };

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

export async function createQuizAction(
  values: unknown,
): Promise<QuizActionResult> {
  const parsed = quizSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      time_per_question: parsed.data.time_per_question,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single();

  if (error || !quiz) return { error: error?.message ?? "Oluşturulamadı." };

  // Junction kayıtları
  if (parsed.data.level_ids.length > 0) {
    await supabase.from("quiz_levels").insert(
      parsed.data.level_ids.map((level_id) => ({
        quiz_id: quiz.id,
        level_id,
      })),
    );
  }

  if (parsed.data.category_ids.length > 0) {
    await supabase.from("quiz_categories").insert(
      parsed.data.category_ids.map((category_id) => ({
        quiz_id: quiz.id,
        category_id,
      })),
    );
  }

  revalidatePath("/admin/quizzes");
  return {};
}

export async function updateQuizAction(
  id: string,
  values: unknown,
): Promise<QuizActionResult> {
  const parsed = quizSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("quizzes")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      time_per_question: parsed.data.time_per_question,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Junction tabloları sıfırla ve yeniden yaz
  await supabase.from("quiz_levels").delete().eq("quiz_id", id);
  await supabase.from("quiz_categories").delete().eq("quiz_id", id);

  if (parsed.data.level_ids.length > 0) {
    await supabase.from("quiz_levels").insert(
      parsed.data.level_ids.map((level_id) => ({ quiz_id: id, level_id })),
    );
  }

  if (parsed.data.category_ids.length > 0) {
    await supabase.from("quiz_categories").insert(
      parsed.data.category_ids.map((category_id) => ({
        quiz_id: id,
        category_id,
      })),
    );
  }

  revalidatePath("/admin/quizzes");
  return {};
}

export async function deleteQuizAction(
  id: string,
): Promise<QuizActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/quizzes");
  return {};
}
