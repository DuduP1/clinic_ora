import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/labels";

export type CurrentStaff = { id: string; full_name: string; email: string; role: StaffRole };

/** המשתמשת המחוברת + רשומת הצוות שלה. מפנה ל-login אם אין session או שהמשתמשת מושבתת. */
export const requireStaff = cache(async (): Promise<CurrentStaff> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, email, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!staff || !staff.is_active) redirect("/login?error=inactive");
  return { id: staff.id, full_name: staff.full_name, email: staff.email, role: staff.role };
});

export async function requireAdmin(): Promise<CurrentStaff> {
  const me = await requireStaff();
  if (me.role !== "admin") redirect("/?error=forbidden");
  return me;
}

/** תוצאת Server Action אחידה לתצוגת toast */
export type ActionResult = { ok: true; message?: string; redirectTo?: string } | { ok: false; error: string; link?: { href: string; label: string } };
