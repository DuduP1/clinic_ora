import Link from "next/link";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { formatTime, TZ } from "@/lib/dates";
import type { AppointmentRow } from "@/components/appointment-list";

const HOUR_PX = 56;
const TWO_LINES_PX = 46; // מתחת לגובה הזה התור מוצג בשורה אחת
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** דקות מתחילת היום לפי שעון ישראל */
function minutesOfDay(d: Date) {
  const [h, m] = hourFmt.format(d).split(":").map(Number);
  return h * 60 + m;
}

const BLOCK_TONE = {
  scheduled: "border-sky-200 bg-sky-50 text-sky-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  cancelled: "border-line bg-sand/60 text-muted line-through decoration-muted/60",
} as const;

/**
 * "היום ביומן" – ציר שעות של תורי היום, כמו ספר תורים בדלפק הקבלה.
 * כל תור ממוקם לפי שעתו ומשכו; תורים חופפים מתחלקים לנתיבים. קו זהב מסמן את השעה הנוכחית.
 */
export function DayRail({ rows, showNow: nowVisible = true, now = new Date() }: { rows: AppointmentRow[]; showNow?: boolean; now?: Date }) {
  const items = rows.map((a) => {
    const start = minutesOfDay(new Date(a.starts_at));
    return { a, start, end: start + (a.treatment?.duration_min ?? 45) };
  });

  // טווח שעות: שעות הפעילות 09:00–19:00, ומתרחב אם יש תור מחוץ לטווח
  const first = Math.min(9, ...items.map((i) => Math.floor(i.start / 60)));
  const last = Math.max(19, ...items.map((i) => Math.ceil(i.end / 60)));
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const y = (min: number) => ((min - first * 60) / 60) * HOUR_PX;

  // חלוקה לנתיבים: תור נכנס לנתיב הראשון שהתפנה
  const lanesEnd: number[] = [];
  const placed = items
    .sort((p, q) => p.start - q.start)
    .map((i) => {
      let lane = lanesEnd.findIndex((end) => end <= i.start);
      if (lane === -1) lane = lanesEnd.push(0) - 1;
      lanesEnd[lane] = i.end;
      return { ...i, lane };
    });
  const lanes = Math.max(1, lanesEnd.length);

  const nowMin = minutesOfDay(now);
  const showNow = nowVisible && nowMin >= first * 60 && nowMin <= last * 60;

  return (
    <div className="relative" style={{ height: (last - first) * HOUR_PX + 16 }}>
      {/* קווי שעות דקים בזהב */}
      {hours.map((h) => (
        <div key={h} className="absolute inset-x-0 flex h-4 items-center gap-3" style={{ top: y(h * 60) - 8 }}>
          <span className="w-11 shrink-0 text-xs leading-4 text-muted tabular-nums">{String(h).padStart(2, "0")}:00</span>
          <span className="h-px flex-1 bg-accent/30" />
        </div>
      ))}

      {/* תורים */}
      <ol className="absolute inset-y-0 start-14 end-0">
        {placed.map(({ a, start, end, lane }) => {
          const st = APPOINTMENT_STATUS[a.status];
          const h = Math.max(y(end) - y(start) - 2, 28);
          const compact = h < TWO_LINES_PX;
          return (
            <li
              key={a.id}
              className="absolute px-0.5"
              style={{
                top: y(start) + 1,
                height: h,
                insetInlineStart: `${(lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
              }}
            >
              <Link
                href={`/appointments/${a.id}/edit`}
                title={`${formatTime(a.starts_at)} · ${a.customer?.full_name ?? ""} · ${a.treatment?.name ?? ""} · ${st.label}`}
                className={`flex h-full overflow-hidden rounded-lg border px-2.5 text-xs leading-snug transition hover:brightness-[0.97] ${
                  compact ? "items-center gap-1.5" : "flex-col justify-center"
                } ${BLOCK_TONE[a.status]}`}
              >
                <span className="flex min-w-0 shrink-0 items-baseline gap-1.5">
                  <span className="font-semibold tabular-nums">{formatTime(a.starts_at)}</span>
                  <span className="truncate font-medium">{a.customer?.full_name}</span>
                </span>
                <span className="min-w-0 truncate opacity-80">
                  {compact && "· "}
                  {a.treatment?.name}
                  {a.staff && ` · ${a.staff.full_name}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* השעה עכשיו */}
      {showNow && (
        <div className="pointer-events-none absolute inset-x-0 flex h-4 items-center gap-3" style={{ top: y(nowMin) - 8 }} aria-hidden>
          <span className="w-11 shrink-0 text-end text-[11px] font-semibold text-accent-strong tabular-nums">{formatTime(now)}</span>
          <span className="relative h-0.5 flex-1 rounded-full bg-accent">
            <span className="absolute -top-[3px] -start-1 h-2 w-2 rounded-full bg-accent" />
          </span>
        </div>
      )}
    </div>
  );
}
