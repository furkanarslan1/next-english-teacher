"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { wordCardSchema } from "@/lib/schemas/word-cards";

export type WordCardActionResult = {
  error?: string;
};

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

export async function createWordCardAction(
  values: unknown,
): Promise<WordCardActionResult> {
  const parsed = wordCardSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { data: maxRow } = await supabase
    .from("word_cards")
    .select("sort_order")
    .eq("level_id", parsed.data.level_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 10;

  const { error } = await supabase.from("word_cards").insert({
    word: parsed.data.word,
    level_id: parsed.data.level_id,
    category_id: parsed.data.category_id || null,
    translation: parsed.data.translation || null,
    example_sentence: parsed.data.example_sentence || null,
    description: parsed.data.description || null,
    sort_order: nextSortOrder,
    is_active: parsed.data.is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/word-cards");
  return {};
}

export async function updateWordCardAction(
  id: string,
  values: unknown,
): Promise<WordCardActionResult> {
  const parsed = wordCardSchema.safeParse(values);
  if (!parsed.success) return { error: "Geçersiz form verisi." };

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("word_cards")
    .update({
      word: parsed.data.word,
      level_id: parsed.data.level_id,
      category_id: parsed.data.category_id || null,
      translation: parsed.data.translation || null,
      example_sentence: parsed.data.example_sentence || null,
      description: parsed.data.description || null,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/word-cards");
  return {};
}

export async function deleteWordCardAction(
  id: string,
): Promise<WordCardActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("word_cards").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/word-cards");
  return {};
}