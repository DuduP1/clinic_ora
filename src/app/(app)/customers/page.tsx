import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/dates";
import { Badge, ButtonLink, Card, EmptyState, Toolbar } from "@/components/ui";

export const metadata = { title: "לקוחות · קליניקת אורה" };

type Row = { id: string; full_name: string; phone: string; next_appointment_at: string | null; open_tickets: number };

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  await requireStaff();
  const q = String((await searchParams).q ?? "").trim();
  const supabase = await createClient();

  let query = supabase
    .from("customers_overview")
    .select("id, full_name, phone, next_appointment_at, open_tickets")
    .order("full_name");

  if (q) {
    const digits = normalizePhone(q);
    const hasDigits = /\d/.test(q);
    // חיפוש לפי חלק מהטלפון (אחרי נרמול) או לפי שם
    query = hasDigits
      ? query.like("phone", `%${digits.replace(/^0/, "")}%`)
      : query.ilike("full_name", `%${q.replace(/[%_,()]/g, "")}%`);
  }
  const { data, error } = await query.returns<Row[]>();
  const rows = data ?? [];

  // התאמה מלאה של טלפון → ישר לכרטיס (חיפוש מהיר מהכותרת)
  if (q && isValidPhone(normalizePhone(q))) {
    const exact = rows.find((r) => r.phone === normalizePhone(q));
    if (exact) redirect(`/customers/${exact.id}`);
  }

  const newHref = q && /\d/.test(q) ? `/customers/new?phone=${encodeURIComponent(q)}` : "/customers/new";

  return (
    <>
      <Toolbar
        title="לקוחות"
        count={
          q ? (
            <>
              {rows.length} תואמות ל-&quot;{q}&quot; ·{" "}
              <Link href="/customers" className="text-accent-strong hover:underline">
                ניקוי חיפוש
              </Link>
            </>
          ) : (
            `${rows.length} לקוחות`
          )
        }
        actions={
          <ButtonLink href={newHref} className="min-h-9 px-3">
            + לקוחה
          </ButtonLink>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">טעינת הלקוחות נכשלה</p>}

      {rows.length === 0 ? (
        <EmptyState>
          {q ? (
            <>
              לא נמצאה לקוחה. <Link href={newHref} className="font-semibold text-accent-strong underline">ליצירת לקוחה חדשה</Link>
            </>
          ) : (
            "אין עדיין לקוחות במערכת"
          )}
        </EmptyState>
      ) : (
        <>
          {/* מחשב: טבלה */}
          <Card className="hidden overflow-x-auto p-0 sm:p-0 md:block">
            <table className="w-full text-sm">
              <thead className="bg-sand/60 text-right text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">שם</th>
                  <th className="px-4 py-3 font-medium">טלפון</th>
                  <th className="px-4 py-3 font-medium">התור הבא</th>
                  <th className="px-4 py-3 font-medium">פניות פתוחות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-line hover:bg-cream">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-accent-strong hover:underline">
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3" dir="ltr" style={{ textAlign: "right" }}>
                      {formatPhone(c.phone)}
                    </td>
                    <td className="px-4 py-3">{c.next_appointment_at ? formatDateTime(c.next_appointment_at) : <span className="text-muted">—</span>}</td>
                    <td className="px-4 py-3">{c.open_tickets > 0 ? <Badge tone="orange">{c.open_tickets}</Badge> : <span className="text-muted">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* נייד: כרטיסים */}
          <ul className="space-y-2 md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/customers/${c.id}`} className="block rounded-xl border border-line bg-surface p-4 active:bg-sand">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c.full_name}</span>
                    {c.open_tickets > 0 && <Badge tone="orange">{c.open_tickets} פתוחות</Badge>}
                  </div>
                  <div className="mt-1 text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>
                    {formatPhone(c.phone)}
                  </div>
                  <div className="mt-1 text-sm">
                    {c.next_appointment_at ? `התור הבא: ${formatDateTime(c.next_appointment_at)}` : <span className="text-muted">אין תור עתידי</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
