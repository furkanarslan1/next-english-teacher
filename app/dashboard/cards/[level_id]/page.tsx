import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CardsViewer } from "./cards-viewer";

const BATCH_SIZE = 20;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function StudentCardsLevelPage({
  params,
  searchParams,
}: {
  params: Promise<{ level_id: string }>;
  searchParams: Promise<{ category_id?: string }>;
}) {
  const { level_id } = await params;
  const { category_id } = await searchParams;

  const supabase = await createClient();

  // 1. Adım: level, kategoriler ve sadece ID'leri paralel çek
  const [{ data: level }, { data: categories }, { data: idRows }] =
    await Promise.all([
      supabase
        .from("levels")
        .select("id, label")
        .eq("id", level_id)
        .single(),
      supabase
        .from("categories")
        .select("id, label")
        .eq("level_id", level_id)
        .eq("is_active", true)
        .order("sort_order"),
      (() => {
        let q = supabase
          .from("word_cards")
          .select("id")
          .eq("level_id", level_id)
          .eq("is_active", true);
        if (category_id) q = q.eq("category_id", category_id);
        return q;
      })(),
    ]);

  if (!level) notFound();

  // 2. Adım: ID'leri shuffle et, ilk batch'i çek
  const allIds = shuffled(idRows?.map((r) => r.id) ?? []);
  const firstBatchIds = allIds.slice(0, BATCH_SIZE);
  const remainingIds = allIds.slice(BATCH_SIZE);

  let firstBatch: {
    id: string;
    word: string;
    translation: string | null;
    example_sentence: string | null;
    description: string | null;
  }[] = [];

  if (firstBatchIds.length > 0) {
    const { data } = await supabase
      .from("word_cards")
      .select("id, word, translation, example_sentence, description")
      .in("id", firstBatchIds)
      .eq("is_active", true);

    const map = new Map(data?.map((c) => [c.id, c]) ?? []);
    firstBatch = firstBatchIds
      .map((id) => map.get(id))
      .filter(Boolean) as typeof firstBatch;
  }

  return (
    <CardsViewer
      levelId={level_id}
      levelLabel={level.label}
      initialCards={firstBatch}
      remainingIds={remainingIds}
      categories={categories ?? []}
      activeCategoryId={category_id ?? null}
    />
  );
}