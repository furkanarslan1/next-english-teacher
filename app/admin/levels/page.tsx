import { createClient } from "@/lib/supabase/server";
import { LevelsClient } from "./levels-client";

export default async function AdminLevelsPage() {
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from("levels")
    .select("id, label, sort_order, is_active")
    .order("sort_order");

  return <LevelsClient initialLevels={levels ?? []} />;
}
