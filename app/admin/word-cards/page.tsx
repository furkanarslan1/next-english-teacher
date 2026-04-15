import { createClient } from "@/lib/supabase/server";
import { WordCardsClient } from "./word-cards-client";

const PAGE_SIZE = 20;

export default async function AdminWordCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; level_id?: string }>;
}) {
  const { page: pageParam, level_id: levelParam } = await searchParams;

  const supabase = await createClient();

  const [{ data: levels }, { data: categories }] = await Promise.all([
    supabase.from("levels").select("id, label").order("sort_order"),
    supabase
      .from("categories")
      .select("id, label, level_id")
      .order("sort_order"),
  ]);

  const currentLevelId = levelParam ?? levels?.[0]?.id ?? "";
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: cards, count } = await supabase
    .from("word_cards")
    .select(
      "id, word, translation, example_sentence, description, sort_order, is_active, level_id, category_id, levels(label), categories(label)",
      { count: "exact" },
    )
    .eq("level_id", currentLevelId)
    .order("sort_order")
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <WordCardsClient
      cards={cards ?? []}
      levels={levels ?? []}
      categories={categories ?? []}
      currentLevelId={currentLevelId}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={count ?? 0}
    />
  );
}
