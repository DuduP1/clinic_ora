"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus } from "@/lib/labels";

const STATUSES: TicketStatus[] = ["new", "in_progress", "closed"];
const ASSIGNEE_REQUIRED = "יש לבחור אחראית לפני מעבר לבטיפול";

function readTicket(formData: FormData) {
  return {
    customer_id: String(formData.get("customer_id") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "new") as TicketStatus,
    assigned_to: String(formData.get("assigned_to") ?? "") || null,
  };
}

function validate(t: ReturnType<typeof readTicket>): string | null {
  if (!t.customer_id) return "יש לבחור לקוחה";
  if (!t.description) return "יש להזין תיאור פנייה";
  if (!STATUSES.includes(t.status)) return "סטטוס לא תקין";
  if (t.status === "in_progress" && !t.assigned_to) return ASSIGNEE_REQUIRED;
  return null;
}

export async function createTicket(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const t = readTicket(formData);
  const invalid = validate(t);
  if (invalid) return { ok: false, error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_tickets")
    .insert({ ...t, source: "manual" })
    .select("id, ticket_number")
    .single();
  if (error) return { ok: false, error: "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: `פנייה #${data.ticket_number} נפתחה`, redirectTo: `/tickets/${data.id}` };
}

export async function updateTicket(id: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const t = readTicket(formData);
  const invalid = validate(t);
  if (invalid) return { ok: false, error: invalid };

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_tickets")
    .update({ description: t.description, status: t.status, assigned_to: t.assigned_to })
    .eq("id", id);
  if (error) return { ok: false, error: error.code === "23514" ? ASSIGNEE_REQUIRED : "השמירה נכשלה, נסי שוב" };

  revalidatePath("/", "layout");
  return { ok: true, message: "הפנייה עודכנה" };
}

/** פעולה מהירה: "אני לוקחת" – שיוך לעצמי והעברה לבטיפול */
export async function takeTicket(id: string): Promise<ActionResult> {
  const me = await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("service_tickets").update({ assigned_to: me.id, status: "in_progress" }).eq("id", id);
  if (error) return { ok: false, error: "העדכון נכשל, נסי שוב" };
  revalidatePath("/", "layout");
  return { ok: true, message: "הפנייה שויכה אלייך ועברה לבטיפול" };
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<ActionResult> {
  await requireStaff();
  if (!STATUSES.includes(status)) return { ok: false, error: "סטטוס לא תקין" };
  const supabase = await createClient();
  const { error } = await supabase.from("service_tickets").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.code === "23514" ? ASSIGNEE_REQUIRED : "העדכון נכשל, נסי שוב" };
  revalidatePath("/", "layout");
  return { ok: true, message: status === "closed" ? "הפנייה נסגרה" : status === "in_progress" ? "הפנייה נפתחה מחדש" : "הסטטוס עודכן" };
}

/**
 * העברה בקאנבאן. מעבר ל"בטיפול" בלי אחראית משייך אוטומטית למשתמשת שגררה –
 * כך נשמר הכלל "בטיפול מחייב אחראית" בלי לחסום את הגרירה.
 */
export async function moveTicket(id: string, status: TicketStatus): Promise<ActionResult> {
  const me = await requireStaff();
  if (!STATUSES.includes(status)) return { ok: false, error: "סטטוס לא תקין" };
  const supabase = await createClient();
  const { data: current } = await supabase.from("service_tickets").select("ticket_number, assigned_to").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "הפנייה לא נמצאה" };

  const selfAssign = status === "in_progress" && !current.assigned_to;
  const { error } = await supabase
    .from("service_tickets")
    .update(selfAssign ? { status, assigned_to: me.id } : { status })
    .eq("id", id);
  if (error) return { ok: false, error: "העדכון נכשל, נסי שוב" };

  revalidatePath("/", "layout");
  const label = status === "new" ? "חדשה" : status === "in_progress" ? "בטיפול" : "נסגרה";
  return { ok: true, message: `פנייה #${current.ticket_number} → ${label}${selfAssign ? " (שויכה אלייך)" : ""}` };
}

export async function deleteTicket(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("service_tickets").delete().eq("id", id);
  if (error) return { ok: false, error: "המחיקה נכשלה" };
  revalidatePath("/", "layout");
  return { ok: true, message: "הפנייה נמחקה", redirectTo: "/tickets" };
}
