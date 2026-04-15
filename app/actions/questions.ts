"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuestionActionResult = { error?: string };

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

type QuestionPayload = {
  quiz_id: string;
  type: "true_false" | "multiple_choice";
  question_text: string;
  options: { label: string; is_correct: boolean }[];
  word_card_id?: string | null;
  question_direction?: "en_to_tr" | "tr_to_en" | null;
  points: number;
  sort_order: number;
};

export async function createQuestionAction(
  payload: QuestionPayload,
): Promise<QuestionActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("questions").insert({
    quiz_id: payload.quiz_id,
    type: payload.type,
    question_text: payload.question_text,
    options: payload.options,
    word_card_id: payload.word_card_id || null,
    question_direction: payload.question_direction || null,
    points: payload.points,
    sort_order: payload.sort_order,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/quizzes/${payload.quiz_id}`);
  return {};
}

export async function updateQuestionAction(
  id: string,
  quizId: string,
  payload: Omit<QuestionPayload, "quiz_id">,
): Promise<QuestionActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("questions")
    .update({
      type: payload.type,
      question_text: payload.question_text,
      options: payload.options,
      word_card_id: payload.word_card_id || null,
      question_direction: payload.question_direction || null,
      points: payload.points,
      sort_order: payload.sort_order,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/admin/quizzes/${quizId}`);
  return {};
}

export async function deleteQuestionAction(
  id: string,
  quizId: string,
): Promise<QuestionActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/quizzes/${quizId}`);
  return {};
}
