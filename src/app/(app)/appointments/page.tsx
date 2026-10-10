import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayRange, ymdInTz, zonedToDate } from "@/lib/dates";
import { APPOINTMENT_STATUS, type AppointmentStatus } from "@/lib/labels";
import { AppointmentList, APPOINTMENT_SELECT, type AppointmentRow } from "@/components/appointment-list";
import { AppointmentCalendar, monthGrid } from "@/components/appointment-calendar";
import { ButtonLink, Card, FilterPill, PageHeader, ViewToggle } from "@/components/ui";

export const metadata = { title: "תורים · קליניקת אורה" };

const RANGES = { upcoming: "עתידיים", today: "היום", week: "השבוע", all: "הכול" } as const;
type Range = keyof typeof RANGES;

export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  await requireStaff();
  const sp = await searchParams;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const range = (String(sp.range ?? "upcoming") in RANGES ? String(sp.range ?? "upcoming") : "upcoming") as Range;
  const status = String(sp.status ?? "") as AppointmentStatus | "";
  const staffId = String(sp.staff ?? "");
  // לוח שנה: חודש מוצג (YYYY-MM) ויום נבחר (YYYY-MM-DD)
  const today = ymdInTz();
  const month = /^\d{4}-\d{2}$/.test(String(sp.month)) ? String(sp.month) : today.slice(0, 7);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(sp.day)) ? String(sp.day) : null;

  const supabase = await createClient();
  let q = supabase.from("appointments").select(APPOINTMENT_SELECT);

  if (view === "calendar") {
    // כל המשבצות שברשת – כולל ימים מהחודש הקודם/הבא שמשלימים שבוע
    const grid = monthGrid(month);
    q = q
      .gte("starts_at", zonedToDate(grid.start, "00:00").toISOString())
      .lt("starts_at", zonedToDate(grid.end, "00:00").toISOString())
      .order("starts_at");
  } else if (range === "upcoming") q = q.gte("starts_at", new Date().toISOString()).order("starts_at");
  else if (range === "today") {
    const r = dayRange(0, 1);
    q = q.gte("starts_at", r.from).lt("starts_at", r.to).order("starts_at");
  } else if (range === "week") {
    const r = dayRange(0, 7);
    q = q.gte("starts_at", r.from).lt("starts_at", r.to).order("starts_at");
  } else q = q.order("starts_at", { ascending: false });

  if (status && status in APPOINTMENT_STATUS) q = q.eq("status", status);
  else if (view === "list" && range === "upcoming") q = q.eq("status", "scheduled");
  if (staffId) q = q.eq("staff_id", staffId);

  const [{ data }, { data: staff }] = await Promise.all([
    q.limit(view === "calendar" ? 1000 : 200).returns<AppointmentRow[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const href = (patch: Record<string, string>) => {
    const base: Record<string, string> =
      view === "calendar" ? { view, month, ...(day && { day }) } : { range };
    const p = new URLSearchParams({ ...base, ...(status && { status }), ...(staffId && { staff: staffId }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/appointments?${p}`;
  };

  return (
    <>
      <PageHeader
        title="תורים"
        subtitle={view === "list" ? `${data?.length ?? 0} תורים` : undefined}
        action={<ButtonLink href={day ? `/appointments/new?date=${day}` : "/appointments/new"}>+ תור חדש</ButtonLink>}
      />

      <div className="mb-4 space-y-2">
        <ViewToggle
          options={[
            { href: `/appointments?${new URLSearchParams({ ...(status && { status }), ...(staffId && { staff: staffId }) })}`, label: "☰ רשימה", active: view === "list" },
            {
              href: `/appointments?${new URLSearchParams({ view: "calendar", ...(status && { status }), ...(staffId && { staff: staffId }) })}`,
              label: "📅 לוח שנה",
              active: view === "calendar",
            },
          ]}
        />
        {view === "list" && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <FilterPill key={r} href={href({ range: r })} active={range === r}>
                {RANGES[r]}
              </FilterPill>
            ))}
          </div>
        )}
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

      {view === "calendar" ? (
        <AppointmentCalendar month={month} selectedDay={day} rows={data ?? []} href={href} />
      ) : (
        <Card>
          <AppointmentList rows={data ?? []} timeOnly={range === "today"} empty={range === "today" ? "אין תורים היום" : "אין תורים להצגה"} />
        </Card>
      )}
    </>
  );
}
