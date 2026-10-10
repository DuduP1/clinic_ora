import { isAuthorized, json, unauthorized } from "@/lib/agent-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { formatDate, formatTime, ymdInTz } from "@/lib/dates";

/**
 * GET /api/agent/next-appointment?phone=0541234567 – התור הבא של לקוחה (PRD 10.1ב)
 * (נתמך גם POST עם { phone } – נוח לכלי סוכנים)
 * נמצא:  { ok: true, found: true, date: "2026-10-21", date_display: "21/10/2026", time: "14:30", treatment }
 * לא נמצא תור עתידי (או לקוחה לא קיימת): { ok: true, found: false }
 */
async function lookup(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!isValidPhone(phone)) return json({ ok: false, error: "invalid_phone" }, 400);

  const { data, error } = await createAdminClient().rpc("agent_next_appointment", { p_phone: phone });
  if (error) {
    console.error("agent_next_appointment failed", error.code, error.message);
    return json({ ok: false, error: "lookup_failed" }, 500);
  }

  const next = data?.[0];
  if (!next) return json({ ok: true, found: false });

  return json({
    ok: true,
    found: true,
    date: ymdInTz(new Date(next.starts_at)),
    date_display: formatDate(next.starts_at),
    time: formatTime(next.starts_at),
    treatment: next.treatment_name,
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  return lookup(new URL(request.url).searchParams.get("phone") ?? "");
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  let body: { phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  return lookup(typeof body.phone === "string" || typeof body.phone === "number" ? String(body.phone) : "");
}
