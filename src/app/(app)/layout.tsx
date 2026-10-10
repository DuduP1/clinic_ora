import Link from "next/link";
import { Suspense } from "react";
import { QuickSearch } from "@/components/quick-search";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/labels";
import { BottomNav, SideNav } from "@/components/nav";
import { ThemedToaster, ThemeToggle } from "@/components/theme";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const me = await requireStaff();
  const supabase = await createClient();
  const { count } = await supabase
    .from("service_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  const newTickets = count ?? 0;
  const isAdmin = me.role === "admin";

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      {/* תפריט צד – מחשב */}
      <aside className="hidden border-l border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:overflow-y-auto md:p-4">
        <Link href="/" className="flex items-center gap-2 px-2 pt-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose/15 font-bold text-rose-dark">א</span>
          <span className="font-bold">קליניקת אורה</span>
        </Link>
        <SideNav isAdmin={isAdmin} newTickets={newTickets} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <Suspense>
                <QuickSearch />
              </Suspense>
            </div>
            <Link
              href="/help"
              aria-label="עזרה וקיצורי מקלדת"
              title="עזרה וקיצורי מקלדת (?)"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lg font-semibold text-ink transition hover:bg-sand sm:inline-flex"
            >
              ?
            </Link>
            <ThemeToggle />
            <details className="relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full px-2 hover:bg-sand">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-on-ink">
                  {me.full_name.charAt(0)}
                </span>
                <span className="hidden text-right leading-tight sm:block">
                  <span className="block text-sm font-medium">{me.full_name}</span>
                  <span className="block text-xs text-muted">{ROLE_LABEL[me.role]}</span>
                </span>
              </summary>
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                <p className="px-3 py-2 text-xs text-muted sm:hidden">
                  {me.full_name} · {ROLE_LABEL[me.role]}
                </p>
                {isAdmin && (
                  <Link href="/staff" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-sand">
                    ניהול צוות
                  </Link>
                )}
                <Link href="/help" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-sand">
                  עזרה ואודות
                </Link>
                <form action={signOut}>
                  <button className="w-full rounded-lg px-3 py-2.5 text-right text-sm text-red-700 hover:bg-red-50">יציאה</button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:pb-10">{children}</main>
      </div>

      <BottomNav newTickets={newTickets} />
      <ThemedToaster />
      <KeyboardShortcuts />
    </div>
  );
}
