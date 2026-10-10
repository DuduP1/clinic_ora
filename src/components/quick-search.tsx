"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { QUICK_SEARCH_ID } from "@/components/keyboard-shortcuts";

/**
 * חיפוש לקוחה מהיר בכותרת (PRD 4) – זמין בכל מסך.
 * טלפון מלא → ישר לכרטיס; אחרת רשימת תוצאות במסך הלקוחות.
 * קיצור מקלדת: "/" או Ctrl/⌘+K (ראו keyboard-shortcuts.tsx).
 */
export function QuickSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  // במסך הלקוחות השדה מציג את החיפוש הנוכחי
  const q = pathname === "/customers" ? (params.get("q") ?? "") : "";

  return (
    <form action="/customers" role="search" className="relative w-full max-w-xs">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        key={q}
        id={QUICK_SEARCH_ID}
        name="q"
        type="search"
        defaultValue={q}
        placeholder="חיפוש טלפון או שם…"
        aria-label="חיפוש לקוחה לפי טלפון או שם"
        aria-keyshortcuts="/ Control+K"
        className="h-10 w-full rounded-full border border-line bg-surface ps-9 pe-4 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/25 md:pe-9"
      />
      <kbd className="pointer-events-none absolute top-1/2 left-3 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] leading-4 text-muted md:block">
        /
      </kbd>
    </form>
  );
}
