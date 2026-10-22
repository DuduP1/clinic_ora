import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { isStale, SOURCE_LABEL, TICKET_STATUS, type TicketSource, type TicketStatus } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { Icon } from "@/components/icons";

export type TicketRow = {
  id: string;
  ticket_number: number;
  description: string;
  status: TicketStatus;
  source: TicketSource;
  assigned_to: string | null;
  created_at: string;
  customer: { id: string; full_name: string } | null;
  assignee: { full_name: string } | null;
};

export const TICKET_SELECT =
  "id, ticket_number, description, status, source, assigned_to, created_at, customer:customers(id, full_name), assignee:staff(full_name)";

export function TicketList({ rows, showCustomer = true, empty }: { rows: TicketRow[]; showCustomer?: boolean; empty: string }) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((t) => {
        const st = TICKET_STATUS[t.status];
        const stale = isStale(t);
        return (
          <li key={t.id} className={stale ? "-mx-2 rounded-lg bg-red-50 px-2" : ""}>
            <Link href={`/tickets/${t.id}`} className="block py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">#{t.ticket_number}</span>
                <Badge tone={st.tone}>{st.label}</Badge>
                {t.source === "agent" && <Badge tone="accent"><Icon name="bot" className="h-3.5 w-3.5" />{SOURCE_LABEL.agent}</Badge>}
                {stale && <Badge tone="red">ללא שיוך מעל 24 שעות</Badge>}
                <span className="ms-auto text-xs text-muted">{formatDateTime(t.created_at)}</span>
              </div>
              <p className="mt-1 line-clamp-2 font-medium">{t.description}</p>
              <p className="mt-0.5 text-sm text-muted">
                {showCustomer && t.customer && `${t.customer.full_name} · `}
                {t.assignee ? `אחראית: ${t.assignee.full_name}` : "ללא אחראית"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
