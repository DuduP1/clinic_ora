"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TICKET_STATUS, type TicketStatus } from "@/lib/labels";
import { setTicketStatus, takeTicket } from "@/app/(app)/tickets/actions";

const STAGES: TicketStatus[] = ["new", "in_progress", "closed"];
const NOTCH = "14px";

/** צורת חץ לכל שלב (RTL: השלב הראשון מימין, החץ מצביע שמאלה) */
function clip(i: number) {
  const first = i === 0;
  const last = i === STAGES.length - 1;
  const left = last ? "0 0, 0 100%" : `${NOTCH} 0, 0 50%, ${NOTCH} 100%`;
  const right = first ? "100% 100%, 100% 0" : `100% 100%, calc(100% - ${NOTCH}) 50%, 100% 0`;
  return `polygon(${left}, ${right})`;
}

/** פס שלבים לפנייה (חדשה ← בטיפול ← נסגרה). לחיצה על שלב מעבירה אליו. */
export function StageBar({ id, status, assigned }: { id: string; status: TicketStatus; assigned: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const current = STAGES.indexOf(status);

  function go(target: TicketStatus) {
    if (target === status || pending) return;
    if (target === "closed" && !window.confirm("לסגור את הפנייה?")) return;
    start(async () => {
      // מעבר לבטיפול בלי אחראית – משייך אליי (כמו "אני לוקחת")
      const res = target === "in_progress" && !assigned ? await takeTicket(id) : await setTicketStatus(id, target);
      if (res.ok) {
        if (res.message) toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className={`flex ${pending ? "opacity-60" : ""}`} role="group" aria-label="שלב הפנייה">
      {STAGES.map((s, i) => {
        const tone =
          i === current
            ? status === "closed"
              ? "bg-emerald-600 text-white"
              : "bg-rose text-white"
            : i < current
              ? "bg-rose/20 text-rose-dark hover:bg-rose/30"
              : "bg-sand text-muted hover:bg-line";
        return (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            disabled={pending}
            aria-current={i === current ? "step" : undefined}
            style={{ clipPath: clip(i), marginInlineStart: i ? "-8px" : 0 }}
            className={`flex h-10 flex-1 items-center justify-center px-5 text-sm font-medium transition ${tone} ${i === current ? "cursor-default" : "cursor-pointer"}`}
          >
            {i < current && "✓ "}
            {TICKET_STATUS[s].label}
          </button>
        );
      })}
    </div>
  );
}
