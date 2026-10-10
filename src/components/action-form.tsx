"use client";

import { startTransition, useActionState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth";

type State = ActionResult | null;

/**
 * טופס שמריץ Server Action ומציג toast: הצלחה (ומעבר ל-redirectTo) או כשל.
 * בכשל הנתונים שהוזנו נשארים בטופס (PRD 11).
 */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
}: {
  action: (prev: State, formData: FormData) => Promise<ActionResult>;
  children: (pending: boolean) => ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        // שליחה ידנית (ולא form action) – כדי ש-React לא יאפס את הטופס, והנתונים יישארו גם בכשל
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {children(pending)}
      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
          {state.link && (
            <>
              {" · "}
              <Link href={state.link.href} className="font-semibold underline">
                {state.link.label}
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
