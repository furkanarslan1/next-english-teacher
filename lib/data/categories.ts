import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

const _getCachedCategories = unstable_cache(
  async (level_id: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("id, label")
      .eq("level_id", level_id)
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  },
  ["categories"],
  { tags: ["categories"], revalidate: 3600 },
);

export const getCachedCategories = (level_id: string) =>
  _getCachedCategories(level_id);