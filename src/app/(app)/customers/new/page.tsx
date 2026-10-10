import { requireStaff } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "../customer-form";
import { createCustomer } from "../actions";

export const metadata = { title: "לקוחה חדשה · קליניקת אורה" };

export default async function NewCustomerPage({ searchParams }: PageProps<"/customers/new">) {
  await requireStaff();
  const phone = String((await searchParams).phone ?? "");
  return (
    <div className="max-w-xl">
      <PageHeader title="לקוחה חדשה" />
      <Card>
        <CustomerForm action={createCustomer} initial={{ phone }} cancelHref="/customers" />
      </Card>
    </div>
  );
}
