import { isAuthorized, json, unauthorized } from "@/lib/agent-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhone, normalizePhone } from "@/lib/phone";

/**
 * POST /api/agent/tickets – פתיחת פנייה מסוכן ה-AI (PRD 10.1א)
 * גוף: { name, phone, description }
 * הצלחה 201: { ok: true, ticket_number, customer_existing }
 * כשל: 400 קלט / 401 מפתח / 500 שמירה → { ok: false, error } – ושום דבר לא נשמר.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  let body: { name?: unknown; phone?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const phone = normalizePhone(typeof body.phone === "string" || typeof body.phone === "number" ? String(body.phone) : "");

  if (!name || !description) return json({ ok: false, error: "missing_fields" }, 400);
  if (!isValidPhone(phone)) return json({ ok: false, error: "invalid_phone" }, 400);

  // פונקציית DB אחת: איתור/יצירת לקוחה + פנייה – אטומי
  const { data, error } = await createAdminClient().rpc("agent_create_ticket", {
    p_name: name,
    p_phone: phone,
    p_description: description,
  });

  if (error || !data?.[0]) {
    console.error("agent_create_ticket failed", error?.code, error?.message);
    return json({ ok: false, error: "save_failed" }, 500);
  }

  return json({ ok: true, ticket_number: data[0].ticket_number, customer_existing: data[0].customer_existing }, 201);
}
