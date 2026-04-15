"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/schemas/auth";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ActionResult = {
  error?: string;
};

export async function loginAction(
  values: { email: string; password: string },
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Email veya şifre hatalı." };
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (admin) {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

export async function signupAction(values: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?verified=1");
}