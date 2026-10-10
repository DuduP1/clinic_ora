import "server-only";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/phone";

/** רשימות לבחירה בטופס תור: לקוחות, מחירון טיפולים פעיל וצוות פעיל */
export async function loadAppointmentOptions() {
  const supabase = await createClient();
  const [{ data: customers }, { data: treatments }, { data: staff }] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone").order("full_name"),
    supabase.from("treatments").select("id, name, price, duration_min").eq("is_active", true).order("sort_order"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  return {
    customers: (customers ?? []).map((c) => ({ id: c.id, label: `${c.full_name} · ${formatPhone(c.phone)}` })),
    treatments: (treatments ?? []).map((t) => ({ ...t, price: Number(t.price) })),
    staff: (staff ?? []).map((s) => ({ id: s.id, label: s.full_name })),
  };
}
