"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, zonedToDate } from "@/lib/dates";
import type { AppointmentStatus } from "@/lib/labels";

const STATUSES: AppointmentStatus[] = ["scheduled", "completed", "cancelled"];

function readAppointment(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const status = String(formData.get("status") ?? "scheduled") as AppointmentStatus;
  return {
    customer_id: String(formData.get("customer_id") ?? ""),
    treatment_id: String(formData.get("treatment_id") ?? ""),
    staff_id: String(formData.get("staff_id") ?? "") || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    status,
    date,
    time,
  };
}

function validate(a: ReturnType<typeof readAppointment>): string | null {
  if (!a.customer_id) return "יש לבחור לקוחה";
  if (!a.treatment_id) return "יש לבחור סוג טיפול";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !/^\d{2}:\d{2}$/.test(a.time)) return "יש לבחור תאריך ושעה";
  if (!STATUSES.includes(a.status)) return "סטטוס לא תקין";
  return null;
}

const toRow = (a: ReturnType<typeof readAppointment>) => ({
  customer_id: a.customer_id,
  treatment_id: a.treatment_id,
  staff_id: a.staff_id,
  notes: a.notes,
  status: a.status,
  starts_at: zonedToDate(a.date, a.time).toISOString(),
});

export async function createAppointment(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const a = readAppointment(formData);
  const invalid = validate(a);
  if (invalid) return { ok: false, error: invalid };

  const row = toRow(a);
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert(row);
  if (error) return { ok: false, error: "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `התור נקבע ל-${formatDate(row.starts_at)} בשעה ${formatTime(row.starts_at)}`,
    redirectTo: String(formData.get("return_to") || `/customers/${a.customer_id}`),
  };
}

export async function updateAppointment(id: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const a = readAppointment(formData);
  const invalid = validate(a);
  if (invalid) return { ok: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update(toRow(a)).eq("id", id);
  if (error) return { ok: false, error: "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: "התור עודכן", redirectTo: String(formData.get("return_to") || `/customers/${a.customer_id}`) };
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult> {
  await requireStaff();
  if (!STATUSES.includes(status)) return { ok: false, error: "סטטוס לא תקין" };
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "העדכון נכשל, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: status === "completed" ? "התור סומן כבוצע" : status === "cancelled" ? "התור בוטל" : "התור הוחזר לעתידי" };
}

export async function deleteAppointment(id: string, returnTo: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: "המחיקה נכשלה" };
  revalidatePath("/", "layout");
  return { ok: true, message: "התור נמחק", redirectTo: returnTo };
}
