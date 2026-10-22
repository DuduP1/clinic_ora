import Link from "next/link";
import type React from "react";
import { AppointmentList, type AppointmentRow } from "@/components/appointment-list";
import { ButtonLink, Card } from "@/components/ui";
import { addDaysYmd, addMonths, dayLabel, formatTime, monthLabel, weekdayOf, ymdInTz } from "@/lib/dates";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { Icon } from "@/components/icons";

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const DOT: Record<AppointmentRow["status"], string> = {
  scheduled: "bg-sky-500",
  completed: "bg-emerald-500",
  cancelled: "bg-stone-400",
};
const CHIP: Record<AppointmentRow["status"], string> = {
  scheduled: "bg-sky-50 text-sky-900 border-sky-200",
  completed: "bg-emerald-50 text-emerald-900 border-emerald-200",
  cancelled: "bg-stone-100 text-stone-500 border-stone-200 line-through",
};

/** גבולות הרשת החודשית (שבועות מלאים, ראשון עד שבת) */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const start = addDaysYmd(first, -weekdayOf(first));
  const daysInMonth = Number(addDaysYmd(`${addMonths(month, 1)}-01`, -1).slice(8));
  const weeks = Math.ceil((weekdayOf(first) + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDaysYmd(start, i));
  return { start, end: addDaysYmd(start, weeks * 7), days };
}

/**
 * לוח שנה חודשי לתורים. דפדוף בין חודשים, לחיצה על יום מציגה את תורי היום מתחת ללוח.
 * במחשב: שעה + שם לקוחה בכל משבצת. בנייד: נקודות צבעוניות לפי סטטוס.
 */
export function AppointmentCalendar({
  month,
  selectedDay,
  rows,
  href,
}: {
  month: string;
  selectedDay: string | null;
  rows: AppointmentRow[];
  href: (patch: Record<string, string>) => string;
}) {
  const { days } = monthGrid(month);
  const today = ymdInTz();
  const byDay = new Map<string, AppointmentRow[]>();
  for (const a of rows) {
    const d = ymdInTz(new Date(a.starts_at));
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const monthCount = rows.filter((a) => a.status !== "cancelled" && ymdInTz(new Date(a.starts_at)).startsWith(month)).length;
  // במחשב תמיד מוצג פאנל יום: היום הנבחר, או היום הנוכחי אם הוא בחודש המוצג
  const panelDay = selectedDay ?? (today.startsWith(month) ? today : null);
  const dayRows = panelDay ? (byDay.get(panelDay) ?? []) : [];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <Card className="p-2.5 sm:p-3">
        {/* ניווט חודשים – ב-RTL "הבא" משמאל */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <Link href={href({ month: addMonths(month, -1), day: "" })} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-sand" aria-label="חודש קודם">
            <Icon name="arrowRight" />
            <span className="hidden sm:inline">&nbsp;חודש קודם</span>
          </Link>
          <div className="text-center">
            <h2 className="text-lg leading-tight font-bold">{monthLabel(month)}</h2>
            <p className="flex items-center justify-center gap-2 text-xs text-muted">
              <span>{monthCount} תורים פעילים</span>
              <span className="hidden items-center gap-2 sm:inline-flex">
                {(Object.keys(APPOINTMENT_STATUS) as AppointmentRow["status"][]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${DOT[s]}`} /> {APPOINTMENT_STATUS[s].label}
                  </span>
                ))}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            {month !== today.slice(0, 7) && (
              <Link href={href({ month: today.slice(0, 7), day: today })} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm hover:bg-sand">
                היום
              </Link>
            )}
            <Link href={href({ month: addMonths(month, 1), day: "" })} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-sand" aria-label="חודש הבא">
              <span className="hidden sm:inline">חודש הבא&nbsp;</span>
              <Icon name="arrowLeft" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-line pb-1 text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7" style={{ "--weeks": days.length / 7 } as React.CSSProperties}>
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            const inMonth = d.startsWith(month);
            const isToday = d === today;
            const isSelected = d === selectedDay;
            const isSaturday = weekdayOf(d) === 6;
            return (
              <Link
                key={d}
                href={href({ day: isSelected ? "" : d, month })}
                aria-label={`${dayLabel(d)}: ${list.length} תורים`}
                aria-current={isToday ? "date" : undefined}
                className={`flex min-h-14 flex-col gap-1 border-b border-l border-line p-1 transition hover:bg-sand/60 sm:h-[max(5rem,calc((100dvh-15.5rem)/var(--weeks)))] sm:min-h-0 sm:overflow-hidden sm:p-1.5 ${
                  inMonth ? (isSaturday ? "bg-stone-50" : "bg-surface") : "bg-cream text-muted/60"
                } ${isSelected ? "relative z-10 ring-2 ring-rose ring-inset" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center self-start rounded-full text-xs ${
                    isToday ? "bg-primary font-bold text-on-primary" : "font-medium"
                  }`}
                >
                  {Number(d.slice(8))}
                </span>

                {/* מחשב: שבבים עם שעה ושם */}
                <ul className="hidden space-y-0.5 sm:block">
                  {list.slice(0, 3).map((a) => (
                    <li key={a.id} className={`truncate rounded border px-1 text-[11px] leading-5 ${CHIP[a.status]}`} title={`${formatTime(a.starts_at)} ${a.customer?.full_name ?? ""} · ${a.treatment?.name ?? ""} (${APPOINTMENT_STATUS[a.status].label})`}>
                      <span className="font-semibold">{formatTime(a.starts_at)}</span> {a.customer?.full_name}
                    </li>
                  ))}
                  {list.length > 3 && <li className="px-1 text-[11px] font-medium text-rose-dark">+{list.length - 3} נוספים</li>}
                </ul>

                {/* נייד: נקודות */}
                {list.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {list.slice(0, 4).map((a) => (
                      <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${DOT[a.status]}`} />
                    ))}
                    {list.length > 4 && <span className="text-[9px] leading-none text-muted">+</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>


      </Card>

      <Card className={`lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto ${panelDay ? "" : "hidden lg:block"}`}>
        {panelDay ? (
          <>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                {dayLabel(panelDay)} · {dayRows.length} תורים
              </h2>
              <ButtonLink href={`/appointments/new?date=${panelDay}`} variant="secondary" className="min-h-9 px-3">
                + תור ביום זה
              </ButtonLink>
            </div>
            <AppointmentList rows={dayRows} timeOnly empty="אין תורים ביום זה" />
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted">לחצי על יום בלוח כדי לראות את התורים שלו</p>
        )}
      </Card>
    </div>
  );
}
