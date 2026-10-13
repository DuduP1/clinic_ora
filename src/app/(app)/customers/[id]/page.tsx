import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/phone";
import { formatDate, formatDateTime } from "@/lib/dates";
import { ActionButton } from "@/components/action-button";
import { AppointmentList, APPOINTMENT_SELECT, pickNextAppointment, type AppointmentRow } from "@/components/appointment-list";
import { TicketList, TICKET_SELECT, type TicketRow } from "@/components/ticket-list";
import { CustomerTimeline } from "@/components/customer-timeline";
import { ContactActions } from "@/components/contact-actions";
import { ButtonLink, Card, ViewToggle } from "@/components/ui";
import { deleteCustomer } from "../actions";

const TABS = ["timeline", "appointments", "tickets"] as const;
type Tab = (typeof TABS)[number];

export default async function CustomerCardPage({ params, searchParams }: PageProps<"/customers/[id]">) {
  const me = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "timeline";
  const supabase = await createClient();

  const [{ data: customer }, { data: appts }, { data: tickets }] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone, notes, created_at").eq("id", id).maybeSingle(),
    supabase.from("appointments").select(APPOINTMENT_SELECT).eq("customer_id", id).order("starts_at", { ascending: false }).returns<AppointmentRow[]>(),
    supabase.from("service_tickets").select(TICKET_SELECT).eq("customer_id", id).order("created_at", { ascending: false }).returns<TicketRow[]>(),
  ]);
  if (!customer) notFound();

  const next = pickNextAppointment(appts ?? []);
  const tabHref = (t: Tab) => (t === "timeline" ? `/customers/${id}` : `/customers/${id}?tab=${t}`);

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* עמודת פרטים קבועה (בהשראת כרטיס איש קשר ב-CRM מסחריים) */}
      <aside className="space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose/20 text-xl font-bold text-rose-dark" aria-hidden>
              {customer.full_name.trim().charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight">{customer.full_name}</h1>
              <p className="mt-0.5 text-xs text-muted">לקוחה מאז {formatDate(customer.created_at)}</p>
            </div>
          </div>

          <ContactActions phone={customer.phone} />

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">טלפון</dt>
              <dd>
                <a href={`tel:${customer.phone}`} className="font-medium text-rose-dark hover:underline" dir="ltr">
                  {formatPhone(customer.phone)}
                </a>
              </dd>
            </div>
            {customer.notes && (
              <div>
                <dt className="text-xs text-muted">הערות פנימיות</dt>
                <dd className="mt-1 rounded-lg bg-sand/60 p-2.5">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className={next ? "border-sky-200 bg-sky-50" : ""}>
          <h2 className="text-sm font-medium text-muted">התור הבא</h2>
          {next ? (
            <p className="mt-1 font-semibold">
              {formatDateTime(next.starts_at)}
              <span className="block font-normal">
                {next.treatment?.name}
                {next.staff && <span className="text-muted"> · {next.staff.full_name}</span>}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-muted">אין תור עתידי</p>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-2 whitespace-nowrap">
          <ButtonLink href={`/appointments/new?customer=${id}`}>+ קביעת תור</ButtonLink>
          <ButtonLink href={`/tickets/new?customer=${id}`} variant="secondary">
            + פתיחת פנייה
          </ButtonLink>
          <ButtonLink href={`/customers/${id}/edit`} variant="secondary">
            עריכה
          </ButtonLink>
          {me.role === "admin" && (
            <ActionButton action={deleteCustomer.bind(null, id)} confirm={`למחוק את ${customer.full_name}? הפעולה אינה הפיכה.`} variant="danger">
              מחיקה
            </ActionButton>
          )}
        </div>
      </aside>

      <Card>
        <div className="mb-3">
          <ViewToggle
            label="לשוניות כרטיס לקוחה"
            options={[
              { href: tabHref("timeline"), label: "ציר זמן", active: tab === "timeline" },
              { href: tabHref("appointments"), label: `תורים (${appts?.length ?? 0})`, active: tab === "appointments" },
              { href: tabHref("tickets"), label: `פניות (${tickets?.length ?? 0})`, active: tab === "tickets" },
            ]}
          />
        </div>
        {tab === "timeline" && <CustomerTimeline appointments={appts ?? []} tickets={tickets ?? []} />}
        {tab === "appointments" && <AppointmentList rows={appts ?? []} showCustomer={false} empty="אין תורים ללקוחה" />}
        {tab === "tickets" && <TicketList rows={tickets ?? []} showCustomer={false} empty="אין פניות ללקוחה" />}
      </Card>
    </div>
  );
}
