import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { APPOINTMENT_STATUS, SOURCE_LABEL, TICKET_STATUS } from "@/lib/labels";
import { formatDateTime, TZ } from "@/lib/dates";
import type { AppointmentRow } from "@/components/appointment-list";
import type { TicketRow } from "@/components/ticket-list";

type Item =
  | { kind: "appointment"; at: string; a: AppointmentRow }
  | { kind: "ticket"; at: string; t: TicketRow };

const monthFmt = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, month: "long", year: "numeric" });

const ICON = {
  appointment: "M7 3v3M17 3v3M4 8h16M5 5h14v15H5z",
  ticket: "M4 5h16v11H8l-4 4z",
};

/** ציר זמן מאוחד: תורים ופניות של הלקוחה לפי תאריך, מקובצים לפי חודש (החדש למעלה) */
export function CustomerTimeline({ appointments, tickets }: { appointments: AppointmentRow[]; tickets: TicketRow[] }) {
  const items: Item[] = [
    ...appointments.map((a) => ({ kind: "appointment" as const, at: a.starts_at, a })),
    ...tickets.map((t) => ({ kind: "ticket" as const, at: t.created_at, t })),
  ].sort((x, y) => y.at.localeCompare(x.at));

  if (items.length === 0) return <EmptyState>אין עדיין תורים או פניות ללקוחה</EmptyState>;

  const groups: { month: string; items: Item[] }[] = [];
  for (const it of items) {
    const month = monthFmt.format(new Date(it.at));
    if (groups.at(-1)?.month !== month) groups.push({ month, items: [] });
    groups.at(-1)!.items.push(it);
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.month}>
          <h3 className="mb-2 text-sm font-semibold text-muted">{g.month}</h3>
          <ol className="relative ms-3.5 space-y-3 border-s border-line ps-5">
            {g.items.map((it) => (
              <li key={`${it.kind}-${it.kind === "appointment" ? it.a.id : it.t.id}`} className="relative">
                <span
                  className={`absolute -start-[2.15rem] top-0.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-surface ${
                    it.kind === "appointment" ? "bg-sky-100 text-sky-800" : "bg-rose/20 text-rose-dark"
                  }`}
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON[it.kind]} />
                  </svg>
                </span>
                {it.kind === "appointment" ? <AppointmentItem a={it.a} /> : <TicketItem t={it.t} />}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function AppointmentItem({ a }: { a: AppointmentRow }) {
  const st = APPOINTMENT_STATUS[a.status];
  return (
    <Link href={`/appointments/${a.id}/edit`} className="block rounded-lg p-1 -m-1 transition hover:bg-sand/60">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">תור · {a.treatment?.name ?? "טיפול"}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {formatDateTime(a.starts_at)}
        {a.staff && ` · ${a.staff.full_name}`}
      </p>
    </Link>
  );
}

function TicketItem({ t }: { t: TicketRow }) {
  const st = TICKET_STATUS[t.status];
  return (
    <Link href={`/tickets/${t.id}`} className="block rounded-lg p-1 -m-1 transition hover:bg-sand/60">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">פנייה #{t.ticket_number}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
        {t.source === "agent" && <Badge tone="rose">🤖 {SOURCE_LABEL.agent}</Badge>}
      </div>
      <p className="mt-0.5 line-clamp-2 text-sm">{t.description}</p>
      <p className="mt-0.5 text-xs text-muted">
        {formatDateTime(t.created_at)} · {t.assignee ? `אחראית: ${t.assignee.full_name}` : "ללא אחראית"}
      </p>
    </Link>
  );
}
