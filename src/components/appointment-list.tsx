import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { Badge, EmptyState } from "@/components/ui";
import { APPOINTMENT_STATUS, type AppointmentStatus } from "@/lib/labels";
import { formatDateTime, formatTime } from "@/lib/dates";
import { setAppointmentStatus } from "@/app/(app)/appointments/actions";
import { Icon } from "@/components/icons";

export type AppointmentRow = {
  id: string;
  starts_at: string;
  status: AppointmentStatus;
  notes: string | null;
  customer: { id: string; full_name: string } | null;
  treatment: { name: string; duration_min: number } | null;
  staff: { full_name: string } | null;
};

export const APPOINTMENT_SELECT =
  "id, starts_at, status, notes, customer:customers(id, full_name), treatment:treatments(name, duration_min), staff:staff(full_name)";

/** התור הבא: סטטוס עתידי וזמנו מאוחר מעכשיו – הקרוב ביותר (PRD 8.5) */
export function pickNextAppointment(rows: AppointmentRow[]): AppointmentRow | undefined {
  const now = Date.now();
  return rows
    .filter((a) => a.status === "scheduled" && new Date(a.starts_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
}

export function AppointmentList({
  rows,
  showCustomer = true,
  timeOnly = false,
  empty,
  emptyAction,
}: {
  rows: AppointmentRow[];
  showCustomer?: boolean;
  /** בתצוגת "היום" – רק שעה */
  timeOnly?: boolean;
  empty: string;
  emptyAction?: { href: string; label: string };
}) {
  if (rows.length === 0) return <EmptyState action={emptyAction}>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((a) => {
        const st = APPOINTMENT_STATUS[a.status];
        return (
          <li key={a.id} className="@container py-3">
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium tabular-nums">{timeOnly ? formatTime(a.starts_at) : formatDateTime(a.starts_at)}</span>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
              <div className="mt-0.5 text-sm text-muted">
                {showCustomer && a.customer && (
                  <>
                    <Link href={`/customers/${a.customer.id}`} className="font-medium text-rose-dark hover:underline">
                      {a.customer.full_name}
                    </Link>
                    {" · "}
                  </>
                )}
                {a.treatment?.name}
                {a.treatment && ` (${a.treatment.duration_min} דק׳)`}
                {a.staff && ` · ${a.staff.full_name}`}
              </div>
              {a.notes && <div className="mt-0.5 flex items-start gap-1 text-xs text-muted"><Icon name="note" className="mt-px h-3.5 w-3.5" />{a.notes}</div>}
            </div>
            <div className="flex gap-1.5">
              {a.status === "scheduled" && (
                <>
                  <ActionButton action={setAppointmentStatus.bind(null, a.id, "completed")} className="min-h-9 px-3">
                    <Icon name="check" />
                    בוצע
                  </ActionButton>
                  <ActionButton
                    action={setAppointmentStatus.bind(null, a.id, "cancelled")}
                    confirm="לבטל את התור?"
                    variant="danger"
                    className="min-h-9 px-3"
                  >
                    בוטל
                  </ActionButton>
                </>
              )}
              <Link href={`/appointments/${a.id}/edit`} className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-muted hover:bg-sand">
                עריכה
              </Link>
            </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
