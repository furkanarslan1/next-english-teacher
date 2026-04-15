"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProgressActionResult = { error?: string };

export async function saveProgressAction(
  level_id: string,
  batch: number,
  score: number,
  total: number,
): Promise<ProgressActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Yetkisiz erişim." };

  const { error } = await supabase.from("level_quiz_progress").upsert(
    {
      student_id: user.id,
      level_id,
      batch,
      score,
      total,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,level_id,batch" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/quizzes/${level_id}`);
  return {};
}