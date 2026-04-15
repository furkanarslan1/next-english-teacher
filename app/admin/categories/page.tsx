import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./categories-client";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: levels }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, label, sort_order, is_active, level_id, levels(label)")
      .order("level_id")
      .order("sort_order"),
    supabase.from("levels").select("id, label").order("sort_order"),
  ]);

  return (
    <CategoriesClient
      initialCategories={categories ?? []}
      levels={levels ?? []}
    />
  );
}