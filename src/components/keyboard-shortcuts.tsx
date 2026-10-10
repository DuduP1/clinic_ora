"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_TARGETS, newHrefFor } from "@/lib/shortcuts";

export const QUICK_SEARCH_ID = "quick-search";

/** מאזין גלובלי לקיצורי המקלדת (הרשימה המלאה: lib/shortcuts.ts ועמוד העזרה) */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let gPressedAt = 0;

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

      // Esc – יציאה משדה
      if (e.key === "Escape" && typing) {
        t?.blur();
        return;
      }

      // Ctrl/⌘+K – חיפוש (גם מתוך שדה)
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        focusSearch();
        return;
      }

      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      // "?" (Shift + /) – עזרה; "/" – חיפוש
      if (e.code === "Slash") {
        e.preventDefault();
        if (e.shiftKey) router.push("/help");
        else focusSearch();
        return;
      }
      if (e.shiftKey) return;

      // G ואז אות – ניווט
      if (e.code === "KeyG") {
        gPressedAt = Date.now();
        return;
      }
      if (Date.now() - gPressedAt < 1200 && NAV_TARGETS[e.code]) {
        e.preventDefault();
        gPressedAt = 0;
        router.push(NAV_TARGETS[e.code].href);
        return;
      }

      // N – חדש לפי המסך
      if (e.code === "KeyN") {
        e.preventDefault();
        router.push(newHrefFor(pathname));
      }
    }

    function focusSearch() {
      const input = document.getElementById(QUICK_SEARCH_ID) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname]);

  return null;
}
