import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "../../customer-form";
import { updateCustomer } from "../../actions";

export const metadata = { title: "עריכת לקוחה · קליניקת אורה" };

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("full_name, phone, notes").eq("id", id).maybeSingle();
  if (!customer) notFound();

  return (
    <div className="max-w-xl">
      <PageHeader title={`עריכת ${customer.full_name}`} />
      <Card>
        <CustomerForm action={updateCustomer.bind(null, id)} initial={customer} cancelHref={`/customers/${id}`} />
      </Card>
    </div>
  );
}
