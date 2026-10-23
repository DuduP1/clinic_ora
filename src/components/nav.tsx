"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** label – לסרגל התחתון בנייד; sideLabel – לתפריט הצד (אם שונה) */
type Item = { href: string; label: string; sideLabel?: string; icon: string; adminOnly?: boolean; desktopOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/", label: "ראשי", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/customers", label: "לקוחות", icon: "M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6" },
  { href: "/appointments", label: "תורים", icon: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" },
  { href: "/tickets", label: "פניות", sideLabel: "פניות שירות", icon: "M4 5h16v11H8l-4 4z" },
  { href: "/staff", label: "צוות", sideLabel: "ניהול צוות", icon: "M17 20v-1a4 4 0 0 0-3-3.87M7 20v-1a4 4 0 0 1 3-3.87M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", adminOnly: true },
  // בנייד העזרה נמצאת בתפריט המשתמשת (הסרגל התחתון מוגבל ל-4 פריטים)
  { href: "/help", label: "עזרה", sideLabel: "עזרה ואודות", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01", desktopOnly: true },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/** תפריט צד – מחשב */
export function SideNav({ isAdmin, newTickets, customers }: { isAdmin: boolean; newTickets: number; customers: number }) {
  const isActive = useActive();
  return (
    <nav className="space-y-1">
      {ITEMS.filter((i) => !i.adminOnly || isAdmin).map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(i.href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${
            isActive(i.href) ? "bg-surface font-bold text-ink" : "text-on-shell-muted hover:bg-surface/60 hover:text-ink"
          }`}
        >
          <Icon d={i.icon} />
          <span className="flex-1">{i.sideLabel ?? i.label}</span>
          {i.href === "/tickets" && newTickets > 0 && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-on-ink tabular-nums" title="פניות חדשות">{newTickets}</span>
          )}
          {i.href === "/customers" && <span className="text-xs text-on-shell-muted tabular-nums">{customers}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** סרגל תחתון – נייד (4 פריטים; ניהול צוות בתפריט המשתמשת) */
export function BottomNav({ newTickets }: { newTickets: number }) {
  const isActive = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.filter((i) => !i.adminOnly && !i.desktopOnly).map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                isActive(i.href) ? "font-semibold text-accent-strong" : "text-muted"
              }`}
            >
              <Icon d={i.icon} />
              {i.label}
              {i.href === "/tickets" && newTickets > 0 && (
                <span className="absolute top-1.5 left-[calc(50%+4px)] rounded-full bg-ink px-1.5 text-[10px] font-bold leading-4 text-on-ink tabular-nums">
                  {newTickets}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
