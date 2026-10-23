import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDaysYmd, formatDate, TZ, ymdInTz, zonedToDate } from "@/lib/dates";
import { isStale, type TicketStatus } from "@/lib/labels";
import { APPOINTMENT_SELECT, type AppointmentRow } from "@/components/appointment-list";
import { DayStrip } from "@/components/day-strip";
import { ButtonLink, Card } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata = { title: "מסך ראשי · קליניקת אורה" };

const weekdayLong = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long" });
const hourNow = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));

type OpenTicket = {
  id: string;
  ticket_number: number;
  description: string;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  customer: { full_name: string } | null;
};

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const me = await requireStaff();
  const { error, day: dayParam } = await searchParams;
  const supabase = await createClient();

  // היום המוצג בפס הגוונים: ברירת מחדל היום, ואפשר לדפדף (?day=YYYY-MM-DD)
  const todayYmd = ymdInTz();
  const day = typeof dayParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : todayYmd;
  const isToday = day === todayYmd;
  const range = { from: zonedToDate(day, "00:00").toISOString(), to: zonedToDate(addDaysYmd(day, 1), "00:00").toISOString() };
  const dayHref = (d: string) => (d === todayYmd ? "/" : `/?day=${d}`);
  const dayDate = zonedToDate(day, "12:00");

  const [{ data: open }, { data: staff }, { data: dayAppts }] = await Promise.all([
    supabase
      .from("service_tickets")
      .select("id, ticket_number, description, status, assigned_to, created_at, customer:customers(full_name)")
      .in("status", ["new", "in_progress"])
      .order("created_at")
      .returns<OpenTicket[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("appointments").select(APPOINTMENT_SELECT).gte("starts_at", range.from).lt("starts_at", range.to).order("starts_at").returns<AppointmentRow[]>(),
  ]);

  const tickets = open ?? [];
  const count = (f: (t: OpenTicket) => boolean) => tickets.filter(f).length;
  const unowned = tickets.filter((t) => !t.assigned_to);
  const stale = count(isStale);
  const appts = dayAppts ?? [];
  const scheduled = appts.filter((a) => a.status === "scheduled").length;

  // פילוח פניות פתוחות לפי אחראית + שורת "ללא שיוך" (PRD 5.2)
  const byAssignee = [
    ...(staff ?? []).map((s) => ({ key: s.id, name: s.full_name, match: (t: OpenTicket) => t.assigned_to === s.id })),
    { key: "none", name: "ללא שיוך", match: (t: OpenTicket) => !t.assigned_to },
  ].map((r) => ({
    ...r,
    newCount: count((t) => r.match(t) && t.status === "new"),
    inProgress: count((t) => r.match(t) && t.status === "in_progress"),
  }));
  const maxLoad = Math.max(1, ...byAssignee.map((r) => r.newCount + r.inProgress));

  const stats = [
    { label: isToday ? "תורים היום" : "תורים ביום זה", value: scheduled, href: "/appointments?range=today", alert: false },
    { label: "פניות חדשות", value: count((t) => t.status === "new"), href: "/tickets?status=new", alert: false },
    { label: "בטיפול", value: count((t) => t.status === "in_progress"), href: "/tickets?status=in_progress", alert: false },
    { label: stale ? "ללא אחראית · מעל 24 שעות" : "ללא אחראית", value: unowned.length, href: "/tickets?assignee=none", alert: stale > 0 },
  ];

  const h = hourNow();
  const greeting = h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <div className="space-y-6">
      {error === "forbidden" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">אין הרשאה למסך זה (מנהלת בלבד).</p>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-[-0.02em] sm:text-[2.75rem]">
            {greeting}, {me.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {weekdayLong.format(new Date())} · <span className="tabular-nums">{formatDate(new Date())}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/customers/new" variant="secondary">+ לקוחה</ButtonLink>
          <ButtonLink href="/appointments/new" variant="secondary">+ תור</ButtonLink>
          <ButtonLink href="/tickets/new">+ פנייה</ButtonLink>
        </div>
      </div>

      {/* פס מצב אחד – במקום קופסאות מדדים */}
      <nav aria-label="מצב" className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-4">
        {stats.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex flex-col justify-center px-5 py-3.5 text-sm transition hover:bg-sand/60 ${i % 2 === 1 ? "border-s border-line" : ""} ${
              i >= 2 ? "border-t border-line lg:border-t-0" : ""
            } ${i === 2 ? "lg:border-s" : ""} ${s.alert ? "bg-red-50 text-red-800 hover:bg-red-100" : "text-muted"}`}
          >
            <span className={`text-3xl font-light tabular-nums ${s.alert ? "font-medium text-red-700" : "text-ink"}`}>{s.value}</span>
            {s.label}
          </Link>
        ))}
      </nav>

      {/* פס הגוונים של היום */}
      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">
            {isToday ? "פס הגוונים של היום" : `פס הגוונים · ${weekdayLong.format(dayDate)} ${formatDate(dayDate)}`}
            <span className="ms-2 hidden font-normal text-muted sm:inline">כל דוגמית היא תור, ברוחב לפי משך הטיפול</span>
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
        {appts.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-sand/40 text-sm text-muted">
            {isToday ? "אין תורים היום." : "אין תורים ביום זה."}
            <Link href="/appointments/new" className="font-medium text-accent-strong hover:underline">
              קביעת תור חדש
            </Link>
          </div>
        ) : (
          <DayStrip rows={appts} />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <h2 className="mb-2 text-sm font-bold">פניות פתוחות לפי אחראית</h2>
          <table className="w-full text-sm">
            <thead className="text-right text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">אחראית</th>
                <th className="py-2 text-center font-medium">חדשות</th>
                <th className="py-2 text-center font-medium">בטיפול</th>
                <th className="w-2/5 py-2 font-medium">עומס</th>
              </tr>
            </thead>
            <tbody>
              {byAssignee.map((r) => {
                const total = r.newCount + r.inProgress;
                const none = r.key === "none";
                return (
                  <tr key={r.key} className="border-b border-line last:border-0">
                    <td className="py-2.5">
                      <Link href={`/tickets?assignee=${r.key}`} className={`hover:underline ${none ? (total ? "font-bold text-red-700" : "text-muted") : "font-medium"}`}>
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-center tabular-nums">{r.newCount}</td>
                    <td className="py-2.5 text-center tabular-nums">{r.inProgress}</td>
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 rounded-sm ${none && total ? "bg-red-200" : "bg-shade-honey"}`}
                          style={{ width: `${(total / maxLoad) * 100}%`, minWidth: total ? 6 : 0 }}
                          aria-hidden
                        />
                        <span className="text-xs font-semibold tabular-nums">{total}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold">ממתינות לשיוך</h2>
            <Link href="/tickets?assignee=none" className="text-sm text-accent-strong hover:underline">
              לכל הפניות
            </Link>
          </div>
          {unowned.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">כל הפניות הפתוחות משויכות.</p>
          ) : (
            <ul className="divide-y divide-line">
              {unowned.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="flex items-baseline gap-3 rounded py-2.5 text-sm hover:bg-sand/50">
                    <span className="text-xs text-muted tabular-nums">#{t.ticket_number}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <b className="font-semibold">{t.customer?.full_name ?? "לקוחה"}</b> · {t.description}
                    </span>
                    <span className={`shrink-0 text-xs tabular-nums ${isStale(t) ? "font-semibold text-red-700" : "text-muted"}`}>{formatDate(t.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
