import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentCardsPage() {
  const supabase = await createClient();

  const [{ data: levels }, { data: counts }] = await Promise.all([
    supabase
      .from("levels")
      .select("id, label")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("word_cards")
      .select("level_id")
      .eq("is_active", true),
  ]);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.level_id, (countMap.get(row.level_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Kelime Kartları</h1>
        <p className="text-sm text-muted-foreground">
          Çalışmak istediğin seviyeyi seç.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(levels ?? []).map((level) => {
          const count = countMap.get(level.id) ?? 0;
          return (
            <Link
              key={level.id}
              href={`/dashboard/cards/${level.id}`}
              className={`group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
                count === 0 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <p className="text-3xl font-bold">{level.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {count > 0 ? `${count} kelime` : "Henüz kart eklenmemiş"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
