import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayRange } from "@/lib/dates";
import { APPOINTMENT_STATUS, type AppointmentStatus } from "@/lib/labels";
import { AppointmentList, APPOINTMENT_SELECT, type AppointmentRow } from "@/components/appointment-list";
import { ButtonLink, Card, FilterPill, PageHeader } from "@/components/ui";

export const metadata = { title: "תורים · קליניקת אורה" };

const RANGES = { upcoming: "עתידיים", today: "היום", week: "השבוע", all: "הכול" } as const;
type Range = keyof typeof RANGES;

export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  await requireStaff();
  const sp = await searchParams;
  const range = (String(sp.range ?? "upcoming") in RANGES ? String(sp.range ?? "upcoming") : "upcoming") as Range;
  const status = String(sp.status ?? "") as AppointmentStatus | "";
  const staffId = String(sp.staff ?? "");

  const supabase = await createClient();
  let q = supabase.from("appointments").select(APPOINTMENT_SELECT);

  if (range === "upcoming") q = q.gte("starts_at", new Date().toISOString()).order("starts_at");
  else if (range === "today") {
    const r = dayRange(0, 1);
    q = q.gte("starts_at", r.from).lt("starts_at", r.to).order("starts_at");
  } else if (range === "week") {
    const r = dayRange(0, 7);
    q = q.gte("starts_at", r.from).lt("starts_at", r.to).order("starts_at");
  } else q = q.order("starts_at", { ascending: false });

  if (status && status in APPOINTMENT_STATUS) q = q.eq("status", status);
  else if (range === "upcoming") q = q.eq("status", "scheduled");
  if (staffId) q = q.eq("staff_id", staffId);

  const [{ data }, { data: staff }] = await Promise.all([
    q.limit(200).returns<AppointmentRow[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ range, ...(status && { status }), ...(staffId && { staff: staffId }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/appointments?${p}`;
  };

  return (
    <>
      <PageHeader title="תורים" subtitle={`${data?.length ?? 0} תורים`} action={<ButtonLink href="/appointments/new">+ תור חדש</ButtonLink>} />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <FilterPill key={r} href={href({ range: r })} active={range === r}>
              {RANGES[r]}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill href={href({ status: "" })} active={!status}>
            כל הסטטוסים
          </FilterPill>
          {(Object.keys(APPOINTMENT_STATUS) as AppointmentStatus[]).map((s) => (
            <FilterPill key={s} href={href({ status: s })} active={status === s}>
              {APPOINTMENT_STATUS[s].label}
            </FilterPill>
          ))}
          <span className="mx-1 w-px bg-line" />
          <FilterPill href={href({ staff: "" })} active={!staffId}>
            כל המטפלות
          </FilterPill>
          {(staff ?? []).map((s) => (
            <FilterPill key={s.id} href={href({ staff: s.id })} active={staffId === s.id}>
              {s.full_name}
            </FilterPill>
          ))}
        </div>
      </div>

      <Card>
        <AppointmentList rows={data ?? []} timeOnly={range === "today"} empty={range === "today" ? "אין תורים היום" : "אין תורים להצגה"} />
      </Card>
    </>
  );
}
