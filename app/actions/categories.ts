"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/schemas/categories";

export type CategoryActionResult = {
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

export async function createCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("categories").insert({
    label: parsed.data.label,
    level_id: parsed.data.level_id,
    sort_order: parsed.data.sort_order,
    is_active: parsed.data.is_active,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return {};
}

export async function updateCategoryAction(
  id: string,
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase
    .from("categories")
    .update({
      label: parsed.data.label,
      level_id: parsed.data.level_id,
      sort_order: parsed.data.sort_order,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return {};
}

export async function deleteCategoryAction(
  id: string,
): Promise<CategoryActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) return { error: authError! };

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return {};
}