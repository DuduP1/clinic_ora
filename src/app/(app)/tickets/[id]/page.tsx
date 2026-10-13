import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { isStale, SOURCE_LABEL, type TicketSource, type TicketStatus } from "@/lib/labels";
import { ActionButton } from "@/components/action-button";
import { StageBar } from "@/components/stage-bar";
import { Badge, Card } from "@/components/ui";

import { TicketForm } from "../ticket-form";
import { deleteTicket, takeTicket, updateTicket } from "../actions";
import { loadTicketOptions } from "../form-data";

/** משך זמן קריא: "40 דק׳" / "5 שעות" / "3 ימים" */
function duration(ms: number) {
  const h = ms / 3600e3;
  if (h < 1) return `${Math.max(1, Math.round(ms / 60e3))} דק׳`;
  if (h < 48) return `${Math.floor(h)} ${Math.floor(h) === 1 ? "שעה" : "שעות"}`;
  return `${Math.floor(h / 24)} ימים`;
}

/** כמה זמן הפנייה פתוחה (או כמה נמשך הטיפול) – אדום כשממתינה מעל 24 שעות בלי אחראית */
function ticketAge(t: { status: TicketStatus; assigned_to: string | null; created_at: string; closed_at: string | null }) {
  const from = new Date(t.created_at).getTime();
  if (t.status === "closed" && t.closed_at) return { label: "זמן טיפול", value: duration(new Date(t.closed_at).getTime() - from), alert: false };
  return { label: "פתוחה כבר", value: duration(Date.now() - from), alert: isStale(t) };
}
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
  const age = ticketAge(t);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">פנייה #{t.ticket_number}</h1>
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
          <div className="mt-4">
            <StageBar id={id} status={t.status} assigned={!!t.assigned_to} />
          </div>
          {(t.status === "new" || me.role === "admin") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {t.status === "new" && <ActionButton action={takeTicket.bind(null, id)} variant="primary">אני לוקחת</ActionButton>}
              {me.role === "admin" && (
                <ActionButton action={deleteTicket.bind(null, id)} confirm="למחוק את הפנייה? הפעולה אינה הפיכה." variant="danger">
                  מחיקה
                </ActionButton>
              )}
            </div>
          )}
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
          <div className={`flex justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 ${age.alert ? "bg-red-50 font-semibold text-red-700" : "bg-sand/60"}`}>
            <dt className={age.alert ? "" : "text-muted"}>{age.label}</dt>
            <dd>{age.value}</dd>
          </div>
          <div className="flex justify-between gap-2"><dt className="text-muted">נפתחה</dt><dd>{formatDateTime(t.created_at)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted">עודכנה</dt><dd>{formatDateTime(t.updated_at)}</dd></div>
          {t.closed_at && <div className="flex justify-between gap-2"><dt className="text-muted">נסגרה</dt><dd>{formatDateTime(t.closed_at)}</dd></div>}
          <div className="flex justify-between gap-2"><dt className="text-muted">מקור</dt><dd>{SOURCE_LABEL[t.source]}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
