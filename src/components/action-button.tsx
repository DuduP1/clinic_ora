"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth";
import { btn } from "@/components/ui";

/** כפתור לפעולה מהירה (בוצע / בוטל / מחיקה), עם חלון אישור אופציונלי. */
export function ActionButton({
  action,
  confirm,
  variant = "secondary",
  className = "",
  children,
}: {
  action: () => Promise<ActionResult>;
  confirm?: string;
  variant?: keyof typeof btn;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`${btn[variant]} ${className}`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          if (res.ok) {
            if (res.message) toast.success(res.message);
            if (res.redirectTo) router.push(res.redirectTo);
            else router.refresh();
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
