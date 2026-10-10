import Link from "next/link";
import { AppointmentList, type AppointmentRow } from "@/components/appointment-list";
import { ButtonLink, Card } from "@/components/ui";
import { addDaysYmd, addMonths, dayLabel, formatTime, monthLabel, weekdayOf, ymdInTz } from "@/lib/dates";
import { APPOINTMENT_STATUS } from "@/lib/labels";

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
  const dayRows = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        {/* ניווט חודשים – ב-RTL "הבא" משמאל */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link href={href({ month: addMonths(month, -1), day: "" })} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-sand" aria-label="חודש קודם">
            → <span className="hidden sm:inline">&nbsp;חודש קודם</span>
          </Link>
          <div className="text-center">
            <h2 className="text-lg font-bold">{monthLabel(month)}</h2>
            <p className="text-xs text-muted">{monthCount} תורים פעילים</p>
          </div>
          <div className="flex items-center gap-1">
            {month !== today.slice(0, 7) && (
              <Link href={href({ month: today.slice(0, 7), day: today })} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm hover:bg-sand">
                היום
              </Link>
            )}
            <Link href={href({ month: addMonths(month, 1), day: "" })} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-sand" aria-label="חודש הבא">
              <span className="hidden sm:inline">חודש הבא&nbsp;</span> ←
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-line pb-1 text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
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
                className={`flex min-h-16 flex-col gap-1 border-b border-l border-line p-1 transition hover:bg-sand/60 sm:min-h-24 sm:p-1.5 ${
                  inMonth ? (isSaturday ? "bg-stone-50" : "bg-surface") : "bg-cream text-muted/60"
                } ${isSelected ? "relative z-10 ring-2 ring-rose ring-inset" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center self-start rounded-full text-xs ${
                    isToday ? "bg-rose font-bold text-white" : "font-medium"
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

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          {(Object.keys(APPOINTMENT_STATUS) as AppointmentRow["status"][]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${DOT[s]}`} /> {APPOINTMENT_STATUS[s].label}
            </span>
          ))}
        </div>
      </Card>

      {selectedDay && (
        <Card>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {dayLabel(selectedDay)} · {dayRows.length} תורים
            </h2>
            <ButtonLink href={`/appointments/new?date=${selectedDay}`} variant="secondary" className="min-h-9">
              + תור ביום זה
            </ButtonLink>
          </div>
          <AppointmentList rows={dayRows} timeOnly empty="אין תורים ביום זה" />
        </Card>
      )}
    </div>
  );
}
