"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";

function readCustomer(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    phone: normalizePhone(String(formData.get("phone") ?? "")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function validate(c: ReturnType<typeof readCustomer>): string | null {
  if (!c.full_name) return "יש להזין שם מלא";
  if (!isValidPhone(c.phone)) return "מספר טלפון לא תקין";
  return null;
}

async function duplicateError(phone: string, exceptId?: string): Promise<ActionResult | null> {
  const supabase = await createClient();
  let q = supabase.from("customers").select("id, full_name").eq("phone", phone);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  return {
    ok: false,
    error: "לקוחה עם מספר זה כבר קיימת",
    link: { href: `/customers/${data.id}`, label: `לכרטיס של ${data.full_name}` },
  };
}

export async function createCustomer(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const c = readCustomer(formData);
  const invalid = validate(c);
  if (invalid) return { ok: false, error: invalid };
  const dup = await duplicateError(c.phone);
  if (dup) return dup;

  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").insert(c).select("id").single();
  if (error) return { ok: false, error: "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: "הלקוחה נשמרה", redirectTo: `/customers/${data.id}` };
}

export async function updateCustomer(id: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const c = readCustomer(formData);
  const invalid = validate(c);
  if (invalid) return { ok: false, error: invalid };
  const dup = await duplicateError(c.phone, id);
  if (dup) return dup;

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(c).eq("id", id);
  if (error) return { ok: false, error: "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: "פרטי הלקוחה עודכנו", redirectTo: `/customers/${id}` };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const [{ count: appts }, { count: tickets }] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("customer_id", id),
    supabase.from("service_tickets").select("id", { count: "exact", head: true }).eq("customer_id", id),
  ]);
  if ((appts ?? 0) + (tickets ?? 0) > 0) {
    return { ok: false, error: "לא ניתן למחוק לקוחה שיש לה תורים או פניות" };
  }
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { ok: false, error: "המחיקה נכשלה" };

  revalidatePath("/", "layout");
  return { ok: true, message: "הלקוחה נמחקה", redirectTo: "/customers" };
}
