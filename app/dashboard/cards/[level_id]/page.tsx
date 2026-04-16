import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CardsViewer } from "./cards-viewer";
import { getCachedLevel, getCachedWordCardIds } from "@/lib/data/levels";
import { getCachedCategories } from "@/lib/data/categories";

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

  // 1. Adım: static veriler cache'ten — DB sorgusu yok
  const [level, allCardRows, categories] = await Promise.all([
    getCachedLevel(level_id),
    getCachedWordCardIds(level_id),
    getCachedCategories(level_id),
  ]);

  if (!level) notFound();

  // 2. Adım: kategori filtresi cache'te (client-side), DB'ye gitme
  const filteredIds = category_id
    ? allCardRows.filter((r) => r.category_id === category_id).map((r) => r.id)
    : allCardRows.map((r) => r.id);

  const allIds = shuffled(filteredIds);
  const firstBatchIds = allIds.slice(0, BATCH_SIZE);
  const remainingIds = allIds.slice(BATCH_SIZE);

  // 3. Adım: sadece ilk batch'in tam verisini çek (20 kart, gerçek DB sorgusu)
  let firstBatch: {
    id: string;
    word: string;
    translation: string | null;
    example_sentence: string | null;
    description: string | null;
  }[] = [];

  if (firstBatchIds.length > 0) {
    const supabase = await createClient();
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
      categories={categories}
      activeCategoryId={category_id ?? null}
    />
  );
}
