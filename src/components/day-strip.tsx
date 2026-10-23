import Link from "next/link";
import { formatTime, TZ } from "@/lib/dates";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { SHADE_ORDER, SHADES, shadeOf } from "@/lib/shades";
import type { AppointmentRow } from "@/components/appointment-list";

const hm = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const minutesOfDay = (d: Date) => {
  const [h, m] = hm.format(d).split(":").map(Number);
  return h * 60 + m;
};

type Slot =
  | { kind: "appt"; a: AppointmentRow; start: number; len: number }
  | { kind: "gap"; start: number; len: number };

/**
 * "פס הגוונים של היום": תורי היום כדוגמיות צבע לפי סדר השעות.
 * רוחב כל דוגמית לפי משך התור, הגוון לפי משפחת הטיפול, והזמן הפנוי כקרטון ריק.
 * במחשב – רצועה אופקית; בנייד – עמודה, כל דוגמית שורה.
 */
export function DayStrip({ rows }: { rows: AppointmentRow[] }) {
  const appts = rows
    .map((a) => ({ a, start: minutesOfDay(new Date(a.starts_at)), len: a.treatment?.duration_min ?? 45 }))
    .sort((x, y) => x.start - y.start);

  // שעות הפעילות 09:00–19:00, ומתרחב אם יש תור מחוץ לטווח
  const open = Math.min(9 * 60, ...appts.map((x) => x.start));
  const close = Math.max(19 * 60, ...appts.map((x) => x.start + x.len));

  const slots: Slot[] = [];
  let cursor = open;
  for (const x of appts) {
    if (x.start > cursor) slots.push({ kind: "gap", start: cursor, len: x.start - cursor });
    slots.push({ kind: "appt", ...x });
    cursor = Math.max(cursor, x.start + x.len);
  }
  if (close > cursor) slots.push({ kind: "gap", start: cursor, len: close - cursor });

  const families = SHADE_ORDER.filter((f) => appts.some((x) => shadeOf(x.a.treatment?.name) === f));

  return (
    <div>
      <ol className="flex flex-col gap-1 md:h-28 md:flex-row" aria-label="תורי היום לפי שעה">
        {slots.map((s) =>
          s.kind === "gap" ? (
            <li
              key={`gap-${s.start}`}
              aria-hidden
              className="hidden rounded-md border border-dashed border-line bg-sand/40 md:block"
              style={{ flexGrow: s.len, flexBasis: 0 }}
            />
          ) : (
            <Swatch key={s.a.id} a={s.a} len={s.len} />
          ),
        )}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="tabular-nums">
          {String(Math.floor(open / 60)).padStart(2, "0")}:00 – {String(Math.ceil(close / 60)).padStart(2, "0")}:00
        </span>
        {families.map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-[3px] ${SHADES[f].bg}`} aria-hidden />
            {SHADES[f].name} · {SHADES[f].label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Swatch({ a, len }: { a: AppointmentRow; len: number }) {
  const shade = SHADES[shadeOf(a.treatment?.name)];
  const cancelled = a.status === "cancelled";
  const done = a.status === "completed";
  return (
    <li className="min-w-0 md:min-w-[5.5rem]" style={{ flexGrow: len, flexBasis: 0 }}>
      <Link
        href={`/appointments/${a.id}/edit`}
        title={`${formatTime(a.starts_at)} · ${a.customer?.full_name ?? ""} · ${a.treatment?.name ?? ""} · ${APPOINTMENT_STATUS[a.status].label}`}
        className={`flex h-full min-h-14 flex-row items-center gap-3 rounded-md px-3 py-2 text-xs transition hover:brightness-95 md:flex-col md:items-stretch md:justify-between md:gap-0 ${
          cancelled ? "border border-line bg-surface text-muted" : `${shade.bg} ${shade.text}`
        }`}
      >
        <span className="flex items-center gap-1.5 font-bold tabular-nums">
          {formatTime(a.starts_at)}
          {done && <span className="rounded-full bg-shade-ink/10 px-1.5 text-[11px] font-medium">בוצע</span>}
          {cancelled && <span className="font-medium">בוטל</span>}
        </span>
        <span className={`min-w-0 ${cancelled ? "line-through" : ""}`}>
          <b className="block truncate text-sm font-bold">{a.customer?.full_name}</b>
          <span className="block truncate opacity-85">
            {a.treatment?.name}
            {a.staff && ` · ${a.staff.full_name.split(" ")[0]}`}
          </span>
        </span>
      </Link>
    </li>
  );
}
