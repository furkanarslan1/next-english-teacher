import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AdminLessonsPage() {
  const supabase = await createClient();

  const [{ data: levels }, { data: topicCounts }] = await Promise.all([
    supabase.from("levels").select("id, label").order("sort_order"),
    supabase
      .from("lesson_topics")
      .select("level_id")
      .eq("is_active", true),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of topicCounts ?? []) {
    countMap[row.level_id] = (countMap[row.level_id] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dersler</h1>
        <p className="text-sm text-muted-foreground">
          Seviye seçerek ders konularını yönetin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {(levels ?? []).map((level) => (
          <Link key={level.id} href={`/admin/lessons/${level.id}`}>
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border p-6 transition-colors hover:bg-muted cursor-pointer">
              <span className="text-3xl font-bold">{level.label}</span>
              <span className="text-xs text-muted-foreground">
                {countMap[level.id] ?? 0} konu
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
