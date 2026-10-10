import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TICKET_STATUS, type TicketStatus } from "@/lib/labels";
import { TicketList, TICKET_SELECT, type TicketRow } from "@/components/ticket-list";
import { TicketBoard } from "@/components/ticket-board";
import { daysAgoIso } from "@/lib/dates";
import { ButtonLink, Card, FilterPill, Toolbar, ViewToggle } from "@/components/ui";
import { FilterSelect } from "@/components/filter-select";

export const metadata = { title: "פניות שירות · קליניקת אורה" };

export default async function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  const me = await requireStaff();
  const sp = await searchParams;
  // ברירת מחדל: פתוחות (חדשה + בטיפול). status=all מציג הכול.
  const status = String(sp.status ?? "open");
  // assignee: "" = כולן, "me" = שלי, "none" = ללא שיוך, או מזהה אשת צוות
  const assignee = String(sp.assignee ?? "");
  // תצוגה: רשימה (ברירת מחדל) או קאנבאן
  const view = sp.view === "board" ? "board" : "list";

  const supabase = await createClient();
  let q = supabase.from("service_tickets").select(TICKET_SELECT).order("created_at", { ascending: false });
  if (view === "board") {
    // קאנבאן: כל הפתוחות + שנסגרו ב-30 הימים האחרונים
    q = q.or(`status.neq.closed,closed_at.gte.${daysAgoIso(30)}`);
  } else if (status === "open") q = q.in("status", ["new", "in_progress"]);
  else if (status in TICKET_STATUS) q = q.eq("status", status);
  if (assignee === "me") q = q.eq("assigned_to", me.id);
  else if (assignee === "none") q = q.is("assigned_to", null);
  else if (assignee) q = q.eq("assigned_to", assignee);

  const [{ data }, { data: staff }] = await Promise.all([
    q.limit(200).returns<TicketRow[]>(),
    supabase.from("staff").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, ...(assignee && { assignee }), ...(view === "board" && { view }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/tickets?${p}`;
  };

  return (
    <>
      <Toolbar
        title="פניות שירות"
        count={`${data?.length ?? 0} פניות`}
        filters={
          <>
            {view === "list" && (
              <ViewToggle
                label="סטטוס"
                options={[
                  { href: href({ status: "open" }), label: "פתוחות", active: status === "open" },
                  ...(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => ({ href: href({ status: s }), label: TICKET_STATUS[s].label, active: status === s })),
                  { href: href({ status: "all" }), label: "הכול", active: status === "all" },
                ]}
              />
            )}
            <FilterPill href={href({ assignee: assignee === "me" ? "" : "me" })} active={assignee === "me"}>
              הפניות שלי
            </FilterPill>
            <FilterSelect
              label="אחראית"
              options={[
                { label: "כולן", href: href({ assignee: "" }), active: !assignee || assignee === "me" },
                { label: "ללא שיוך", href: href({ assignee: "none" }), active: assignee === "none" },
                ...(staff ?? []).map((s) => ({ label: s.full_name, href: href({ assignee: s.id }), active: assignee === s.id })),
              ]}
            />
          </>
        }
        actions={
          <>
            <ViewToggle
              options={[
                { href: href({ view: "" }), label: "☰ רשימה", active: view === "list" },
                { href: href({ view: "board" }), label: "▦ קאנבאן", active: view === "board" },
              ]}
            />
            <ButtonLink href="/tickets/new" className="min-h-9 px-3">
              + פנייה
            </ButtonLink>
          </>
        }
      />

      {view === "board" ? (
        <TicketBoard rows={data ?? []} />
      ) : (
        <Card>
          <TicketList rows={data ?? []} empty={status === "open" && !assignee ? "אין פניות פתוחות 🎉" : "אין פניות להצגה"} />
        </Card>
      )}
    </>
  );
}
