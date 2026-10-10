import { requireStaff } from "@/lib/auth";
import { ymdInTz } from "@/lib/dates";
import { Card, PageHeader } from "@/components/ui";
import { AppointmentForm } from "../appointment-form";
import { createAppointment } from "../actions";
import { loadAppointmentOptions } from "../form-data";

export const metadata = { title: "תור חדש · קליניקת אורה" };

export default async function NewAppointmentPage({ searchParams }: PageProps<"/appointments/new">) {
  const me = await requireStaff();
  const customerId = String((await searchParams).customer ?? "");
  const options = await loadAppointmentOptions();
  const lock = !!customerId && options.customers.some((c) => c.id === customerId);

  return (
    <div className="max-w-xl">
      <PageHeader title="קביעת תור" />
      <Card>
        <AppointmentForm
          action={createAppointment}
          {...options}
          initial={{ customer_id: lock ? customerId : undefined, staff_id: me.id, date: ymdInTz(), time: "10:00" }}
          lockCustomer={lock}
          returnTo={lock ? `/customers/${customerId}` : "/appointments"}
          isNew
        />
      </Card>
    </div>
  );
}
