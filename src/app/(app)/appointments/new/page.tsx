import { requireStaff } from "@/lib/auth";
import { ymdInTz } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { AppointmentForm } from "../appointment-form";
import { createAppointment } from "../actions";
import { loadAppointmentOptions } from "../form-data";

export const metadata = { title: "תור חדש · קליניקת אורה" };

export default async function NewAppointmentPage({ searchParams }: PageProps<"/appointments/new">) {
  const me = await requireStaff();
  const sp = await searchParams;
  const customerId = String(sp.customer ?? "");
  // מגיעים מלוח השנה עם ?date=YYYY-MM-DD
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(sp.date)) ? String(sp.date) : ymdInTz();
  const options = await loadAppointmentOptions();
  const lock = !!customerId && options.customers.some((c) => c.id === customerId);

  return (
    <div className="max-w-xl">
      <PageHeader title="קביעת תור" />
      <Card>
        <AppointmentForm
          action={createAppointment}
          {...options}
          initial={{ customer_id: lock ? customerId : undefined, staff_id: me.id, date, time: "10:00" }}
          lockCustomer={lock}
          returnTo={lock ? `/customers/${customerId}` : sp.date ? `/appointments?view=calendar&month=${date.slice(0, 7)}&day=${date}` : "/appointments"}
          isNew
        />
      </Card>
    </div>
  );
}
