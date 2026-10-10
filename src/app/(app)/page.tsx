import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dayRange, formatDate } from "@/lib/dates";
import { isStale, type TicketStatus } from "@/lib/labels";
import { AppointmentList, APPOINTMENT_SELECT, type AppointmentRow } from "@/components/appointment-list";
import { ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "מסך ראשי · קליניקת אורה" };

type OpenTicket = { status: TicketStatus; assigned_to: string | null; created_at: string };

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const me = await requireStaff();
  const { error } = await searchParams;
  const supabase = await createClient();
  const today = dayRange(0, 1);

  const [{ data: open }, { data: staff }, { data: todayAppts }] = await Promise.all([
    supabase.from("service_tickets").select("status, assigned_to, created_at").in("status", ["new", "in_progress"]).returns<OpenTicket[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("appointments").select(APPOINTMENT_SELECT).gte("starts_at", today.from).lt("starts_at", today.to).order("starts_at").returns<AppointmentRow[]>(),
  ]);

  const tickets = open ?? [];
  const count = (f: (t: OpenTicket) => boolean) => tickets.filter(f).length;
  const stale = count(isStale);
  const scheduledToday = (todayAppts ?? []).filter((a) => a.status === "scheduled").length;

  // פילוח פניות פתוחות לפי אחראית + שורת "ללא שיוך" (PRD 5.2)
  const byAssignee = [
    ...(staff ?? []).map((s) => ({ key: s.id, name: s.full_name, match: (t: OpenTicket) => t.assigned_to === s.id })),
    { key: "none", name: "ללא שיוך", match: (t: OpenTicket) => !t.assigned_to },
  ].map((r) => ({
    ...r,
    newCount: count((t) => r.match(t) && t.status === "new"),
    inProgress: count((t) => r.match(t) && t.status === "in_progress"),
  }));

  const stats = [
    { label: "פניות חדשות", value: count((t) => t.status === "new"), href: "/tickets?status=new", tone: "text-sky-700" },
    { label: "פניות בטיפול", value: count((t) => t.status === "in_progress"), href: "/tickets?status=in_progress", tone: "text-amber-700" },
    { label: "ללא אחראית", value: count((t) => !t.assigned_to), href: "/tickets?assignee=none", tone: stale ? "text-red-700" : "text-ink" },
    { label: "תורים היום", value: scheduledToday, href: "/appointments?range=today", tone: "text-rose-dark" },
  ];

  return (
    <div className="space-y-5">
      {error === "forbidden" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">אין הרשאה למסך זה (מנהלת בלבד).</p>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">שלום, {me.full_name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted">{formatDate(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/customers/new" variant="secondary">+ לקוחה</ButtonLink>
          <ButtonLink href="/appointments/new" variant="secondary">+ תור</ButtonLink>
          <ButtonLink href="/tickets/new">+ פנייה</ButtonLink>
        </div>
      </div>

      {stale > 0 && (
        <Link href="/tickets?assignee=none" className="block rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ {stale} {stale === 1 ? "פנייה חדשה ממתינה" : "פניות חדשות ממתינות"} יותר מ-24 שעות בלי אחראית – לחצי לשיוך
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-rose/50">
            <div className={`text-3xl font-bold ${s.tone}`}>{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">פניות פתוחות לפי אחראית</h2>
          <table className="w-full text-sm">
            <thead className="text-right text-muted">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">אחראית</th>
                <th className="py-2 text-center font-medium">חדשות</th>
                <th className="py-2 text-center font-medium">בטיפול</th>
                <th className="py-2 text-center font-medium">סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {byAssignee.map((r) => (
                <tr key={r.key} className="border-b border-line last:border-0">
                  <td className="py-2.5">
                    <Link href={`/tickets?assignee=${r.key}`} className={`hover:underline ${r.key === "none" ? "text-muted" : "font-medium text-rose-dark"}`}>
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-2.5 text-center">{r.newCount}</td>
                  <td className="py-2.5 text-center">{r.inProgress}</td>
                  <td className="py-2.5 text-center font-semibold">{r.newCount + r.inProgress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold">תורים היום</h2>
            <Link href="/appointments?range=today" className="text-sm text-rose-dark hover:underline">לכל התורים</Link>
          </div>
          <AppointmentList rows={todayAppts ?? []} timeOnly empty="אין תורים היום" />
        </Card>
      </div>
    </div>
  );
}
