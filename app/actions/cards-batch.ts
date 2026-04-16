"use server";

import { createClient } from "@/lib/supabase/server";

export type CardRow = {
  id: string;
  word: string;
  translation: string | null;
  example_sentence: string | null;
  description: string | null;
};

export async function fetchCardsByIds(ids: string[]): Promise<CardRow[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("word_cards")
    .select("id, word, translation, example_sentence, description")
    .in("id", ids)
    .eq("is_active", true);

  // Supabase .in() sırayı garanti etmez, shuffled sırayı koru
  const map = new Map(data?.map((c) => [c.id, c]) ?? []);
  return ids.map((id) => map.get(id)).filter(Boolean) as CardRow[];
}
