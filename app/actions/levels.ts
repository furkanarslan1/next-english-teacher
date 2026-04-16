"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { levelSchema } from "@/lib/schemas/levels";

export type LevelActionResult = {
  error?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, error: "Yetkisiz erişim." };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) return { supabase: null, error: "Yetkisiz erişim." };

  return { supabase, error: null };
}

export async function createLevelAction(
  values: unknown,
): Promise<LevelActionResult> {
  const parsed = levelSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { data: maxRow } = await supabase
    .from("levels")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 10;

  const { error } = await supabase.from("levels").insert({
    label: parsed.data.label,
    sort_order: nextSortOrder,
    is_active: parsed.data.is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/levels");
  revalidateTag("levels", { expire: 0 });
  return {};
}

export async function updateLevelAction(
  id: string,
  values: unknown,
): Promise<LevelActionResult> {
  const parsed = levelSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("levels")
    .update({
      label: parsed.data.label,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/levels");
  revalidateTag("levels", { expire: 0 });
  return {};
}

export async function deleteLevelAction(
  id: string,
): Promise<LevelActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("levels").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/levels");
  revalidateTag("levels", { expire: 0 });
  return {};
}
