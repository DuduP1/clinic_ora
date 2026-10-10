"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; adminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/", label: "ראשי", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/customers", label: "לקוחות", icon: "M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6" },
  { href: "/appointments", label: "תורים", icon: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" },
  { href: "/tickets", label: "פניות", icon: "M4 5h16v11H8l-4 4z" },
  { href: "/staff", label: "צוות", icon: "M17 20v-1a4 4 0 0 0-3-3.87M7 20v-1a4 4 0 0 1 3-3.87M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", adminOnly: true },
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
export function SideNav({ isAdmin, newTickets }: { isAdmin: boolean; newTickets: number }) {
  const isActive = useActive();
  return (
    <nav className="space-y-1">
      {ITEMS.filter((i) => !i.adminOnly || isAdmin).map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${
            isActive(i.href) ? "bg-rose/15 font-semibold text-rose-dark" : "text-ink hover:bg-sand"
          }`}
        >
          <Icon d={i.icon} />
          <span className="flex-1">{i.label === "צוות" ? "ניהול צוות" : i.label === "פניות" ? "פניות שירות" : i.label}</span>
          {i.href === "/tickets" && newTickets > 0 && (
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">{newTickets}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** סרגל תחתון – נייד (4 פריטים; ניהול צוות בתפריט המשתמשת) */
export function BottomNav({ newTickets }: { newTickets: number }) {
  const isActive = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.filter((i) => !i.adminOnly).map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                isActive(i.href) ? "font-semibold text-rose-dark" : "text-muted"
              }`}
            >
              <Icon d={i.icon} />
              {i.label}
              {i.href === "/tickets" && newTickets > 0 && (
                <span className="absolute top-1.5 left-[calc(50%+4px)] rounded-full bg-sky-600 px-1.5 text-[10px] font-semibold leading-4 text-white">
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
