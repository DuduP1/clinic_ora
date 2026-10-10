"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "יש להזין אימייל וסיסמה" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "אימייל או סיסמה שגויים" };

  const { data: staff } = await supabase.from("staff").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!staff?.is_active) {
    await supabase.auth.signOut();
    return { error: "המשתמשת אינה פעילה במערכת. פני לרותם." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
