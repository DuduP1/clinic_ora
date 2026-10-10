import "server-only";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/phone";

export async function loadTicketOptions() {
  const supabase = await createClient();
  const [{ data: customers }, { data: staff }] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone").order("full_name"),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  return {
    customers: (customers ?? []).map((c) => ({ id: c.id, label: `${c.full_name} · ${formatPhone(c.phone)}` })),
    staff: (staff ?? []).map((s) => ({ id: s.id, label: s.full_name })),
  };
}
