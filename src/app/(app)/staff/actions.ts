"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, type ActionResult } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/labels";

/** הוספת משתמשת: יצירת חשבון התחברות + רשומת צוות. מנהלת בלבד. */
export async function createStaff(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff") as StaffRole;

  if (!full_name) return { ok: false, error: "יש להזין שם" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "אימייל לא תקין" };
  if (password.length < 8) return { ok: false, error: "סיסמה זמנית – לפחות 8 תווים" };
  if (role !== "admin" && role !== "staff") return { ok: false, error: "תפקיד לא תקין" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    return { ok: false, error: error?.message.includes("already") ? "כבר קיימת משתמשת עם אימייל זה" : "יצירת המשתמשת נכשלה" };
  }
  const { error: e2 } = await admin.from("staff").insert({ id: data.user.id, full_name, email, role });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id); // שומרים על עקביות – בלי חשבון יתום
    return { ok: false, error: "יצירת המשתמשת נכשלה" };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: `${full_name} נוספה לצוות`, redirectTo: "/staff" };
}

export async function setStaffRole(id: string, role: StaffRole): Promise<ActionResult> {
  const me = await requireAdmin();
  if (id === me.id) return { ok: false, error: "לא ניתן לשנות את התפקיד של עצמך" };
  const { error } = await createAdminClient().from("staff").update({ role }).eq("id", id);
  if (error) return { ok: false, error: "העדכון נכשל" };
  revalidatePath("/", "layout");
  return { ok: true, message: "התפקיד עודכן" };
}

/** השבתה במקום מחיקה – ההיסטוריה של הפניות נשמרת (PRD 5.7) */
export async function setStaffActive(id: string, active: boolean): Promise<ActionResult> {
  const me = await requireAdmin();
  if (id === me.id) return { ok: false, error: "לא ניתן להשבית את עצמך" };
  const admin = createAdminClient();
  const { error } = await admin.from("staff").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: "העדכון נכשל" };
  // חסימת התחברות ברמת Auth (וביטול sessions קיימים בפקיעת הטוקן)
  await admin.auth.admin.updateUserById(id, { ban_duration: active ? "none" : "876000h" });
  revalidatePath("/", "layout");
  return { ok: true, message: active ? "המשתמשת הופעלה מחדש" : "המשתמשת הושבתה" };
}
