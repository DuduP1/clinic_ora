/**
 * קיצורי המקלדת של המערכת – מקור אחד לביצוע (KeyboardShortcuts) ולתצוגה בעמוד העזרה.
 * הזיהוי לפי המקש הפיזי (KeyboardEvent.code), כך שהקיצורים עובדים גם במקלדת עברית וגם באנגלית.
 */
export type Shortcut = { keys: string[][]; he?: string; description: string; group: "כללי" | "ניווט" | "פעולות" };

export const NAV_TARGETS: Record<string, { href: string; label: string; he: string }> = {
  KeyH: { href: "/", label: "ראשי", he: "י" },
  KeyC: { href: "/customers", label: "לקוחות", he: "ב" },
  KeyA: { href: "/appointments", label: "תורים", he: "ש" },
  KeyT: { href: "/tickets", label: "פניות שירות", he: "א" },
};

/** "חדש" לפי המסך הנוכחי */
export function newHrefFor(pathname: string): string {
  if (pathname.startsWith("/appointments")) return "/appointments/new";
  if (pathname.startsWith("/tickets")) return "/tickets/new";
  return "/customers/new";
}

export const SHORTCUTS: Shortcut[] = [
  { group: "כללי", keys: [["/"], ["Ctrl", "K"]], he: "במקלדת עברית: מקש הנקודה (.)", description: "מעבר לחיפוש לקוחה (טלפון או שם)" },
  { group: "כללי", keys: [["?"]], he: "Shift + /", description: "פתיחת עמוד העזרה" },
  { group: "כללי", keys: [["Esc"]], description: "יציאה משדה הקלדה" },
  ...Object.values(NAV_TARGETS).map((t, i) => ({
    group: "ניווט" as const,
    keys: [["G", Object.keys(NAV_TARGETS)[i].slice(3)]],
    he: `ע ואז ${t.he}`,
    description: `מעבר למסך ${t.label}`,
  })),
  { group: "פעולות", keys: [["N"]], he: "מ", description: "חדש לפי המסך: לקוחה / תור / פנייה" },
];
