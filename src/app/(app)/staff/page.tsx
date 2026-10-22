import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type StaffRole } from "@/lib/labels";
import { ActionButton } from "@/components/action-button";
import { Badge, Card, PageHeader } from "@/components/ui";
import { setStaffActive, setStaffRole } from "./actions";
import { NewStaffForm } from "./new-staff-form";

export const metadata = { title: "ניהול צוות · קליניקת אורה" };

type Row = { id: string; full_name: string; email: string; role: StaffRole; is_active: boolean };

export default async function StaffPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("staff").select("id, full_name, email, role, is_active").order("created_at").returns<Row[]>();

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <PageHeader title="ניהול צוות" subtitle="מנהלת בלבד · השבתה במקום מחיקה, כדי לשמור היסטוריה" />
        <Card>
          <ul className="divide-y divide-line">
            {(data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.full_name}</span>
                    <Badge tone={s.role === "admin" ? "accent" : "gray"}>{ROLE_LABEL[s.role]}</Badge>
                    {!s.is_active && <Badge tone="red">מושבתת</Badge>}
                    {s.id === me.id && <span className="text-xs text-muted">(את)</span>}
                  </div>
                  <div className="text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>{s.email}</div>
                </div>
                {s.id !== me.id && (
                  <div className="flex gap-1.5">
                    <ActionButton action={setStaffRole.bind(null, s.id, s.role === "admin" ? "staff" : "admin")} confirm={`לשנות את התפקיד של ${s.full_name}?`} className="min-h-9 px-3">
                      {s.role === "admin" ? "הפכי לצוות" : "הפכי למנהלת"}
                    </ActionButton>
                    <ActionButton
                      action={setStaffActive.bind(null, s.id, !s.is_active)}
                      confirm={s.is_active ? `להשבית את ${s.full_name}? היא לא תוכל להתחבר.` : undefined}
                      variant={s.is_active ? "danger" : "secondary"}
                      className="min-h-9 px-3"
                    >
                      {s.is_active ? "השבתה" : "הפעלה"}
                    </ActionButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="h-fit">
        <h2 className="mb-3 text-lg font-semibold">הוספת משתמשת</h2>
        <NewStaffForm />
      </Card>
    </div>
  );
}
