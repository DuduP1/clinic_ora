import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toInputParts } from "@/lib/dates";
import { ActionButton } from "@/components/action-button";
import { Card, PageHeader } from "@/components/ui";
import { AppointmentForm } from "../../appointment-form";
import { deleteAppointment, updateAppointment } from "../../actions";
import { loadAppointmentOptions } from "../../form-data";

export const metadata = { title: "עריכת תור · קליניקת אורה" };

export default async function EditAppointmentPage({ params }: PageProps<"/appointments/[id]/edit">) {
  const me = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("appointments")
    .select("id, customer_id, treatment_id, staff_id, starts_at, status, notes")
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();
  const options = await loadAppointmentOptions();
  const returnTo = `/customers/${a.customer_id}`;

  return (
    <div className="max-w-xl">
      <PageHeader
        title="עריכת תור"
        action={
          me.role === "admin" && (
            <ActionButton action={deleteAppointment.bind(null, id, returnTo)} confirm="למחוק את התור? הפעולה אינה הפיכה." variant="danger">
              מחיקה
            </ActionButton>
          )
        }
      />
      <Card>
        <AppointmentForm
          action={updateAppointment.bind(null, id)}
          {...options}
          initial={{ ...a, ...toInputParts(a.starts_at) }}
          lockCustomer
          returnTo={returnTo}
          isNew={false}
        />
      </Card>
    </div>
  );
}
