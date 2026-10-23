import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPhone } from "@/lib/phone";
import { formatDate, formatDateTime } from "@/lib/dates";
import { ActionButton } from "@/components/action-button";
import { AppointmentList, APPOINTMENT_SELECT, pickNextAppointment, type AppointmentRow } from "@/components/appointment-list";
import { TicketList, TICKET_SELECT, type TicketRow } from "@/components/ticket-list";
import { ButtonLink, Card } from "@/components/ui";
import { deleteCustomer } from "../actions";
import { SHADES, shadeOf } from "@/lib/shades";

export default async function CustomerCardPage({ params }: PageProps<"/customers/[id]">) {
  const me = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: appts }, { data: tickets }] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone, notes, created_at").eq("id", id).maybeSingle(),
    supabase.from("appointments").select(APPOINTMENT_SELECT).eq("customer_id", id).order("starts_at", { ascending: false }).returns<AppointmentRow[]>(),
    supabase.from("service_tickets").select(TICKET_SELECT).eq("customer_id", id).order("created_at", { ascending: false }).returns<TicketRow[]>(),
  ]);
  if (!customer) notFound();

  const next = pickNextAppointment(appts ?? []);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-light tracking-[-0.02em]">{customer.full_name}</h1>
            <a href={`tel:${customer.phone}`} className="mt-1 inline-block text-lg text-accent-strong" dir="ltr">
              {formatPhone(customer.phone)}
            </a>
            <p className="mt-1 text-xs text-muted">לקוחה מאז {formatDate(customer.created_at)}</p>
            {/* פלטת הטיפולים שלה – כל תור (שלא בוטל) כדוגמית, מהישן לחדש */}
            {(appts ?? []).some((a) => a.status !== "cancelled") && (
              <div className="mt-3 flex items-center gap-1" aria-label="פלטת הטיפולים">
                {[...(appts ?? [])]
                  .filter((a) => a.status !== "cancelled")
                  .reverse()
                  .map((a) => (
                    <span
                      key={a.id}
                      title={`${formatDate(a.starts_at)} · ${a.treatment?.name ?? ""}`}
                      className={`h-5 w-7 rounded-[4px] ${SHADES[shadeOf(a.treatment?.name)].bg} ${a.status === "scheduled" ? "ring-2 ring-ink/70 ring-offset-1 ring-offset-surface" : ""}`}
                    />
                  ))}
                <span className="ms-2 text-xs text-muted">פלטת הטיפולים</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/appointments/new?customer=${id}`}>+ קביעת תור</ButtonLink>
            <ButtonLink href={`/tickets/new?customer=${id}`} variant="secondary">
              + פתיחת פנייה
            </ButtonLink>
            <ButtonLink href={`/customers/${id}/edit`} variant="ghost">
              עריכה
            </ButtonLink>
            {me.role === "admin" && (
              <ActionButton action={deleteCustomer.bind(null, id)} confirm={`למחוק את ${customer.full_name}? הפעולה אינה הפיכה.`} variant="danger">
                מחיקה
              </ActionButton>
            )}
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4 rounded-xl bg-sand/60 p-3 text-sm">
            <span className="font-medium">הערות פנימיות: </span>
            {customer.notes}
          </div>
        )}
      </Card>

      <Card className={next ? "border-sky-200 bg-sky-50" : ""}>
        <h2 className="text-sm font-medium text-muted">התור הבא</h2>
        {next ? (
          <p className="mt-1 text-lg font-semibold">
            {formatDateTime(next.starts_at)} · {next.treatment?.name}
            {next.staff && <span className="font-normal text-muted"> · {next.staff.full_name}</span>}
          </p>
        ) : (
          <p className="mt-1 text-muted">אין תור עתידי</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-lg font-semibold">היסטוריית תורים ({appts?.length ?? 0})</h2>
          <AppointmentList rows={appts ?? []} showCustomer={false} empty="אין תורים ללקוחה" emptyAction={{ href: `/appointments/new?customer=${id}`, label: "קביעת תור ראשון" }} />
        </Card>
        <Card>
          <h2 className="mb-1 text-lg font-semibold">פניות שירות ({tickets?.length ?? 0})</h2>
          <TicketList rows={tickets ?? []} showCustomer={false} empty="אין פניות ללקוחה" />
        </Card>
      </div>
    </div>
  );
}
