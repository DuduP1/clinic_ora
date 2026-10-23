/**
 * כרטיס הגוונים: כל משפחת טיפולים מקבלת גוון קבוע.
 * המשפחה נגזרת משם הטיפול במחירון (supabase/migrations/*_seed_treatments.sql),
 * כך שטיפול חדש מקבל גוון בלי שינוי בבסיס הנתונים.
 */
export type ShadeFamily = "facial" | "injection" | "laser" | "consult" | "other";

export const SHADES: Record<ShadeFamily, { label: string; name: string; bg: string; text: string }> = {
  facial: { label: "טיפולי פנים", name: "פורצלן", bg: "bg-shade-porcelain", text: "text-shade-ink" },
  injection: { label: "הזרקות", name: "סומק", bg: "bg-shade-blush", text: "text-shade-ink" },
  laser: { label: "לייזר", name: "דבש", bg: "bg-shade-honey", text: "text-shade-ink" },
  consult: { label: "התייעצות", name: "מוקה", bg: "bg-shade-mocha", text: "text-[#FBFAF8]" },
  other: { label: "אחר", name: "חול", bg: "bg-shade-sand", text: "text-shade-ink" },
};

export const SHADE_ORDER: ShadeFamily[] = ["facial", "injection", "laser", "consult", "other"];

export function shadeOf(treatmentName: string | null | undefined): ShadeFamily {
  const n = treatmentName ?? "";
  if (/התייעצות|ניסיון/.test(n)) return "consult";
  if (/לייזר/.test(n)) return "laser";
  if (/בוטוקס|חומצה|הזרק|מילוי/.test(n)) return "injection";
  if (/פנים|ניקוי|פילינג/.test(n)) return "facial";
  return "other";
}
