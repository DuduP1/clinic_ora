/**
 * סט אייקונים אחיד למערכת: קו 1.8, פינות מעוגלות, 24×24.
 * במקום אימוג'י או תווים (✓ ⚠️ 🤖 📅) – כדי שכל האייקונים ייראו מאותה משפחה.
 */
const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.01",
  bot: "M8 9h8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3zM12 9V5.5M12 4.5v.01M9.5 14v.01M14.5 14v.01",
  calendar: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z",
  note: "M6 4h9l4 4v12H6zM14 4v5h5M9 13h6M9 16.5h4",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  plus: "M12 5v14M5 12h14",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  board: "M4 5h4.5v14H4zM10 5h4.5v9H10zM16 5h4v11h-4z",
  // חצים לפי כיוון המסך: ב-RTL "קדימה" הוא שמאלה
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
