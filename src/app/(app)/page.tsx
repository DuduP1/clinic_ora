import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDaysYmd, formatDate, TZ, ymdInTz, zonedToDate } from "@/lib/dates";
import { isStale, type TicketStatus } from "@/lib/labels";
import { APPOINTMENT_SELECT, type AppointmentRow } from "@/components/appointment-list";
import { DayRail } from "@/components/day-rail";
import { ButtonLink, Card } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata = { title: "מסך ראשי · קליניקת אורה" };

const weekdayLong = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long" });

type OpenTicket = { status: TicketStatus; assigned_to: string | null; created_at: string };

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const me = await requireStaff();
  const { error, day: dayParam } = await searchParams;
  const supabase = await createClient();
  // היום המוצג ביומן: ברירת מחדל היום, ואפשר לדפדף ליום אחר (?day=YYYY-MM-DD)
  const todayYmd = ymdInTz();
  const day = typeof dayParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : todayYmd;
  const isToday = day === todayYmd;
  const today = { from: zonedToDate(day, "00:00").toISOString(), to: zonedToDate(addDaysYmd(day, 1), "00:00").toISOString() };
  const dayHref = (d: string) => (d === todayYmd ? "/" : `/?day=${d}`);

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
    { label: isToday ? "תורים היום" : "תורים ביום זה", value: scheduledToday, href: "/appointments?range=today", dot: "bg-accent", alert: false },
    { label: "פניות חדשות", value: count((t) => t.status === "new"), href: "/tickets?status=new", dot: "bg-sky-500", alert: false },
    { label: "בטיפול", value: count((t) => t.status === "in_progress"), href: "/tickets?status=in_progress", dot: "bg-amber-500", alert: false },
    { label: "ללא אחראית", value: count((t) => !t.assigned_to), href: "/tickets?assignee=none", dot: "bg-red-700", alert: count((t) => !t.assigned_to) > 0 },
  ];

  return (
    <div className="space-y-5">
      {error === "forbidden" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">אין הרשאה למסך זה (מנהלת בלבד).</p>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl leading-tight">שלום, {me.full_name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">
            {weekdayLong.format(new Date())} · <span className="tabular-nums">{formatDate(new Date())}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/customers/new" variant="secondary">+ לקוחה</ButtonLink>
          <ButtonLink href="/appointments/new" variant="secondary">+ תור</ButtonLink>
          <ButtonLink href="/tickets/new">+ פנייה</ButtonLink>
        </div>
      </div>

      {/* פס מצב אחד שקט במקום ארבע קופסאות מספרים */}
      <nav aria-label="מצב היום" className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4 sm:divide-x sm:divide-line sm:divide-x-reverse">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            href={s.href}
            className={`flex items-center gap-3 px-4 py-3 transition hover:bg-sand/50 ${i < 2 ? "border-b border-line sm:border-b-0" : ""} ${i % 2 === 0 ? "border-e border-line sm:border-e-0" : ""} ${s.alert ? "bg-red-50 hover:bg-red-100" : ""}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
            <span className={`text-2xl font-semibold tabular-nums ${s.alert ? "text-red-700" : "text-ink"}`}>{s.value}</span>
            <span className={`text-sm ${s.alert ? "text-red-800" : "text-muted"}`}>{s.label}</span>
          </Link>
        ))}
      </nav>

      {stale > 0 && (
        <Link href="/tickets?assignee=none" className="-mt-2 flex items-center gap-2 text-sm text-red-700 hover:underline">
          <Icon name="alert" />
          {stale} {stale === 1 ? "פנייה חדשה ממתינה" : "פניות חדשות ממתינות"} יותר מ-24 שעות בלי אחראית – לחצי לשיוך
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">
              {isToday ? "היום ביומן" : `${weekdayLong.format(zonedToDate(day, "12:00"))} · ${formatDate(zonedToDate(day, "12:00"))}`}
            </h2>
            <div className="flex items-center gap-1 text-sm">
              <Link href={dayHref(addDaysYmd(day, -1))} aria-label="יום קודם" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sand">
                <Icon name="arrowRight" />
              </Link>
              {!isToday && (
                <Link href="/" className="inline-flex h-9 items-center rounded-lg border border-line px-3 hover:bg-sand">
                  היום
                </Link>
              )}
              <Link href={dayHref(addDaysYmd(day, 1))} aria-label="יום הבא" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sand">
                <Icon name="arrowLeft" />
              </Link>
            </div>
          </div>
          {(todayAppts ?? []).length === 0 && (
            <p className="mb-3 text-sm text-muted">
              {isToday ? "אין תורים היום." : "אין תורים ביום זה."}{" "}
              <Link href="/appointments/new" className="font-medium text-accent-strong hover:underline">
                קביעת תור חדש
              </Link>
            </p>
          )}
          <DayRail rows={todayAppts ?? []} showNow={isToday} />
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-2xl">פניות פתוחות לפי אחראית</h2>
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
                    <Link href={`/tickets?assignee=${r.key}`} className={`hover:underline ${r.key === "none" ? "text-muted" : "font-medium text-accent-strong"}`}>
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-2.5 text-center tabular-nums">{r.newCount}</td>
                  <td className="py-2.5 text-center tabular-nums">{r.inProgress}</td>
                  <td className="py-2.5 text-center font-semibold tabular-nums">{r.newCount + r.inProgress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
