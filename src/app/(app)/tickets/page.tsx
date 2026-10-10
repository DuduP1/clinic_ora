import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TICKET_STATUS, type TicketStatus } from "@/lib/labels";
import { TicketList, TICKET_SELECT, type TicketRow } from "@/components/ticket-list";
import { ButtonLink, Card, FilterPill, PageHeader } from "@/components/ui";

export const metadata = { title: "פניות שירות · קליניקת אורה" };

export default async function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  const me = await requireStaff();
  const sp = await searchParams;
  // ברירת מחדל: פתוחות (חדשה + בטיפול). status=all מציג הכול.
  const status = String(sp.status ?? "open");
  // assignee: "" = כולן, "me" = שלי, "none" = ללא שיוך, או מזהה אשת צוות
  const assignee = String(sp.assignee ?? "");

  const supabase = await createClient();
  let q = supabase.from("service_tickets").select(TICKET_SELECT).order("created_at", { ascending: false });
  if (status === "open") q = q.in("status", ["new", "in_progress"]);
  else if (status in TICKET_STATUS) q = q.eq("status", status);
  if (assignee === "me") q = q.eq("assigned_to", me.id);
  else if (assignee === "none") q = q.is("assigned_to", null);
  else if (assignee) q = q.eq("assigned_to", assignee);

  const [{ data }, { data: staff }] = await Promise.all([
    q.limit(200).returns<TicketRow[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, ...(assignee && { assignee }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/tickets?${p}`;
  };

  return (
    <>
      <PageHeader title="פניות שירות" subtitle={`${data?.length ?? 0} פניות`} action={<ButtonLink href="/tickets/new">+ פנייה חדשה</ButtonLink>} />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterPill href={href({ status: "open" })} active={status === "open"}>פתוחות</FilterPill>
          {(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => (
            <FilterPill key={s} href={href({ status: s })} active={status === s}>
              {TICKET_STATUS[s].label}
            </FilterPill>
          ))}
          <FilterPill href={href({ status: "all" })} active={status === "all"}>הכול</FilterPill>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill href={href({ assignee: "" })} active={!assignee}>כל האחראיות</FilterPill>
          <FilterPill href={href({ assignee: "me" })} active={assignee === "me"}>הפניות שלי</FilterPill>
          <FilterPill href={href({ assignee: "none" })} active={assignee === "none"}>ללא שיוך</FilterPill>
          {(staff ?? []).map((s) => (
            <FilterPill key={s.id} href={href({ assignee: s.id })} active={assignee === s.id}>
              {s.full_name}
            </FilterPill>
          ))}
        </div>
      </div>

      <Card>
        <TicketList rows={data ?? []} empty={status === "open" && !assignee ? "אין פניות פתוחות 🎉" : "אין פניות להצגה"} />
      </Card>
    </>
  );
}
