import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const levelId = req.nextUrl.searchParams.get("level_id");
  if (!levelId) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("word_cards")
    .select("id, word, translation")
    .eq("level_id", levelId)
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json(data ?? []);
}
