"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui";
import { isStale, SOURCE_LABEL, TICKET_STATUS, type TicketStatus } from "@/lib/labels";
import { formatDate } from "@/lib/dates";
import { moveTicket } from "@/app/(app)/tickets/actions";
import type { TicketRow } from "@/components/ticket-list";

const COLUMNS: TicketStatus[] = ["new", "in_progress", "closed"];

const COLUMN_STYLE: Record<TicketStatus, string> = {
  new: "border-t-sky-500",
  in_progress: "border-t-amber-500",
  closed: "border-t-emerald-500",
};

/** כפתורי העברה (לנייד ולמקלדת) – לאן אפשר להזיז מכל עמודה */
const MOVES: Record<TicketStatus, { to: TicketStatus; label: string }[]> = {
  new: [{ to: "in_progress", label: "לבטיפול ←" }],
  in_progress: [
    { to: "new", label: "→ לחדשה" },
    { to: "closed", label: "לסגירה ←" },
  ],
  closed: [{ to: "in_progress", label: "→ פתיחה מחדש" }],
};

/** לוח קאנבאן לפניות: גרירה בין עמודות (מחשב) או כפתורי העברה (נייד). */
export function TicketBoard({ rows }: { rows: TicketRow[] }) {
  const router = useRouter();
  // עדכון אופטימי: הכרטיס זז מיד; בכשל React מחזיר אותו למקום כשהפעולה מסתיימת
  const [items, moveOptimistic] = useOptimistic(rows, (state, m: { id: string; to: TicketStatus }) =>
    state.map((x) => (x.id === m.id ? { ...x, status: m.to } : x)),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TicketStatus | null>(null);
  const [, start] = useTransition();

  function move(id: string, to: TicketStatus) {
    const t = items.find((x) => x.id === id);
    if (!t || t.status === to) return;
    start(async () => {
      moveOptimistic({ id, to });
      const res = await moveTicket(id, to);
      if (res.ok) {
        if (res.message) toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {COLUMNS.map((col) => {
        const list = items.filter((t) => t.status === col);
        const st = TICKET_STATUS[col];
        return (
          <section
            key={col}
            aria-label={st.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col);
            }}
            onDragLeave={() => setOver((o) => (o === col ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain") || dragId;
              if (id) move(id, col);
              setDragId(null);
            }}
            className={`flex w-[85%] shrink-0 snap-center flex-col rounded-2xl border border-t-4 border-line bg-sand/40 p-3 transition md:h-[calc(100dvh-9.5rem)] md:w-auto ${COLUMN_STYLE[col]} ${
              over === col ? "bg-rose/10 ring-2 ring-rose/40" : ""
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-semibold">{st.label}</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">{list.length}</span>
            </header>

            <ul className="-mx-1 flex min-h-24 flex-1 flex-col gap-2 px-1 md:overflow-y-auto">
              {list.length === 0 && (
                <li className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">גררי לכאן פנייה</li>
              )}
              {list.map((t) => {
                const stale = isStale(t);
                return (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(t.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`cursor-grab rounded-xl border bg-surface p-3 shadow-sm transition active:cursor-grabbing ${
                      stale ? "border-red-300" : "border-line"
                    } ${dragId === t.id ? "opacity-50" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/tickets/${t.id}`} className="text-sm font-semibold text-rose-dark hover:underline">
                        #{t.ticket_number}
                      </Link>
                      {t.source === "agent" && <Badge tone="rose">🤖 {SOURCE_LABEL.agent}</Badge>}
                      {stale && <Badge tone="red">מעל 24 ש׳</Badge>}
                      <span className="ms-auto text-xs text-muted">{formatDate(t.created_at)}</span>
                    </div>
                    <Link href={`/tickets/${t.id}`} className="mt-1 line-clamp-2 block text-sm font-medium">
                      {t.description}
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                      <span className="truncate">{t.customer?.full_name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 ${t.assignee ? "bg-stone-100" : "bg-red-50 text-red-700"}`}>
                        {t.assignee?.full_name ?? "ללא שיוך"}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
                      {MOVES[col].map((m) => (
                        <button
                          key={m.to}
                          type="button"
                          onClick={() => move(t.id, m.to)}
                          className="min-h-9 flex-1 rounded-lg border border-line text-xs hover:bg-sand"
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
