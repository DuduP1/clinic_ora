import { requireStaff } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { TicketForm } from "../ticket-form";
import { createTicket } from "../actions";
import { loadTicketOptions } from "../form-data";

export const metadata = { title: "פנייה חדשה · קליניקת אורה" };

export default async function NewTicketPage({ searchParams }: PageProps<"/tickets/new">) {
  await requireStaff();
  const customerId = String((await searchParams).customer ?? "");
  const options = await loadTicketOptions();
  const lock = !!customerId && options.customers.some((c) => c.id === customerId);

  return (
    <div className="max-w-xl">
      <PageHeader title="פתיחת פנייה" />
      <Card>
        <TicketForm
          action={createTicket}
          {...options}
          initial={{ customer_id: lock ? customerId : undefined, status: "new" }}
          lockCustomer={lock}
          cancelHref={lock ? `/customers/${customerId}` : "/tickets"}
          isNew
        />
      </Card>
    </div>
  );
}
