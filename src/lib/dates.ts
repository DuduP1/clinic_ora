export const TZ = "Asia/Jerusalem";

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const weekdayFmt = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "short" });

/** DD/MM/YYYY */
export const formatDate = (iso: string | Date) => dateFmt.format(new Date(iso));
/** HH:mm */
export const formatTime = (iso: string | Date) => timeFmt.format(new Date(iso));
/** "יום ה׳ 16/10/2026 · 11:00" */
export const formatDateTime = (iso: string | Date) =>
  `${weekdayFmt.format(new Date(iso))} ${formatDate(iso)} · ${formatTime(iso)}`;

/** YYYY-MM-DD של תאריך מסוים לפי שעון ישראל */
export function ymdInTz(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** ההיסט של שעון ישראל ("+03:00") בתאריך נתון */
function tzOffset(d: Date): string {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  return name === "GMT" ? "+00:00" : name.replace("GMT", "");
}

/** "2026-10-16" + "11:00" (שעון ישראל) → Date ב-UTC */
export function zonedToDate(ymd: string, hhmm: string): Date {
  const guess = new Date(`${ymd}T${hhmm}:00Z`);
  return new Date(`${ymd}T${hhmm}:00${tzOffset(guess)}`);
}

/** ערכי קלט לטופס (תאריך ושעה מקומיים) מתוך ISO */
export function toInputParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return { date: ymdInTz(d), time: formatTime(d) };
}

/** גבולות היום / השבוע לפי שעון ישראל, כ-ISO */
export function dayRange(offsetDays = 0, lengthDays = 1): { from: string; to: string } {
  const today = ymdInTz();
  const base = new Date(`${today}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  const end = new Date(base);
  end.setUTCDate(end.getUTCDate() + lengthDays);
  return {
    from: zonedToDate(base.toISOString().slice(0, 10), "00:00").toISOString(),
    to: zonedToDate(end.toISOString().slice(0, 10), "00:00").toISOString(),
  };
}

/** ISO של לפני N ימים */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600e3).toISOString();
}

// ---------- עזרי לוח שנה (מחרוזות YYYY-MM-DD, חישוב בצהרי UTC כדי לא להיתקל במעברי שעון) ----------
const noon = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

export function addDaysYmd(ymd: string, days: number): string {
  const d = noon(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10" ± n חודשים */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  return d.toISOString().slice(0, 7);
}

/** 0 = ראשון … 6 = שבת */
export const weekdayOf = (ymd: string) => noon(ymd).getUTCDay();

/** "אוקטובר 2026" */
export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" }).format(noon(`${month}-01`));

/** "יום שישי, 16 באוקטובר" */
export const dayLabel = (ymd: string) =>
  new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(noon(ymd));
