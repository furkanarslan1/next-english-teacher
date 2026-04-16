import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// ─── Levels ──────────────────────────────────────────────────────────────────

const _getCachedActiveLevels = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("levels")
      .select("id, label")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["active-levels"],
  { tags: ["levels"], revalidate: 3600 },
);

export const getCachedActiveLevels = () => _getCachedActiveLevels();

// Tek level — listeyi cache'ten okur, ekstra DB sorgusu atmaz
export async function getCachedLevel(level_id: string) {
  const levels = await getCachedActiveLevels();
  return levels.find((l) => l.id === level_id) ?? null;
}

// ─── Word card counts (level listesi için) ────────────────────────────────────

const _getCachedWordCountsByLevel = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("word_cards")
      .select("level_id")
      .eq("is_active", true);

    const map = new Map<string, number>();
    for (const row of data ?? []) {
      map.set(row.level_id, (map.get(row.level_id) ?? 0) + 1);
    }
    return Object.fromEntries(map); // Map JSON-serializable değil
  },
  ["word-counts-by-level"],
  { tags: ["word-cards"], revalidate: 3600 },
);

export async function getCachedWordCountsByLevel(): Promise<Map<string, number>> {
  const obj = await _getCachedWordCountsByLevel();
  return new Map(Object.entries(obj));
}

// ─── Word card IDs per level (sıralı, shuffle için) ──────────────────────────

const _getCachedWordCardIds = unstable_cache(
  async (level_id: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("word_cards")
      .select("id, category_id")
      .eq("level_id", level_id)
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["word-card-ids"],
  { tags: ["word-cards"], revalidate: 3600 },
);

export const getCachedWordCardIds = (level_id: string) =>
  _getCachedWordCardIds(level_id);