import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { isStale, SOURCE_LABEL, TICKET_STATUS, type TicketSource, type TicketStatus } from "@/lib/labels";
import { ActionButton } from "@/components/action-button";
import { Badge, Card } from "@/components/ui";
import { TicketForm } from "../ticket-form";
import { deleteTicket, setTicketStatus, takeTicket, updateTicket } from "../actions";
import { loadTicketOptions } from "../form-data";

type Ticket = {
  id: string;
  ticket_number: number;
  customer_id: string;
  description: string;
  status: TicketStatus;
  assigned_to: string | null;
  source: TicketSource;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  customer: { id: string; full_name: string; phone: string } | null;
};

export default async function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  const me = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("service_tickets")
    .select("id, ticket_number, customer_id, description, status, assigned_to, source, created_at, updated_at, closed_at, customer:customers(id, full_name, phone)")
    .eq("id", id)
    .maybeSingle<Ticket>();
  if (!t) notFound();
  const options = await loadTicketOptions();
  const st = TICKET_STATUS[t.status];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">פנייה #{t.ticket_number}</h1>
            <Badge tone={st.tone}>{st.label}</Badge>
            {t.source === "agent" && <Badge tone="rose">🤖 {SOURCE_LABEL.agent}</Badge>}
            {isStale(t) && <Badge tone="red">ללא שיוך מעל 24 שעות</Badge>}
          </div>
          {t.customer && (
            <p className="mt-2 text-sm">
              <Link href={`/customers/${t.customer.id}`} className="font-semibold text-rose-dark hover:underline">
                {t.customer.full_name}
              </Link>
              <span className="text-muted">
                {" · "}
                <bdi dir="ltr">{formatPhone(t.customer.phone)}</bdi>
              </span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {t.status === "new" && <ActionButton action={takeTicket.bind(null, id)} variant="primary">אני לוקחת</ActionButton>}
            {t.status !== "closed" && (
              <ActionButton action={setTicketStatus.bind(null, id, "closed")} confirm="לסגור את הפנייה?">
                סגירת פנייה
              </ActionButton>
            )}
            {t.status === "closed" && (
              t.assigned_to ? (
                <ActionButton action={setTicketStatus.bind(null, id, "in_progress")}>פתיחה מחדש</ActionButton>
              ) : (
                <ActionButton action={takeTicket.bind(null, id)}>פתיחה מחדש (אליי)</ActionButton>
              )
            )}
            {me.role === "admin" && (
              <ActionButton action={deleteTicket.bind(null, id)} confirm="למחוק את הפנייה? הפעולה אינה הפיכה." variant="danger">
                מחיקה
              </ActionButton>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">עדכון פנייה</h2>
          <TicketForm
            key={t.updated_at}
            action={updateTicket.bind(null, id)}
            {...options}
            initial={t}
            lockCustomer
            cancelHref="/tickets"
            isNew={false}
          />
        </Card>
      </div>

      <Card className="h-fit text-sm">
        <h2 className="mb-2 font-semibold">פרטים</h2>
        <dl className="space-y-2">
          <div className="flex justify-between gap-2"><dt className="text-muted">נפתחה</dt><dd>{formatDateTime(t.created_at)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted">עודכנה</dt><dd>{formatDateTime(t.updated_at)}</dd></div>
          {t.closed_at && <div className="flex justify-between gap-2"><dt className="text-muted">נסגרה</dt><dd>{formatDateTime(t.closed_at)}</dd></div>}
          <div className="flex justify-between gap-2"><dt className="text-muted">מקור</dt><dd>{SOURCE_LABEL[t.source]}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
