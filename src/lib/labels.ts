export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type TicketStatus = "new" | "in_progress" | "closed";
export type StaffRole = "admin" | "staff";
export type TicketSource = "manual" | "agent";

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "עתידי", tone: "blue" },
  completed: { label: "בוצע", tone: "green" },
  cancelled: { label: "בוטל", tone: "gray" },
};

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: Tone }> = {
  new: { label: "חדשה", tone: "blue" },
  in_progress: { label: "בטיפול", tone: "orange" },
  closed: { label: "נסגרה", tone: "green" },
};

export const ROLE_LABEL: Record<StaffRole, string> = { admin: "מנהלת", staff: "צוות" };
export const SOURCE_LABEL: Record<TicketSource, string> = { manual: "ידני", agent: "סוכן AI" };

export type Tone = "blue" | "orange" | "green" | "gray" | "red" | "rose";

export const TONE_CLASS: Record<Tone, string> = {
  blue: "bg-sky-100 text-sky-800 ring-sky-200",
  orange: "bg-amber-100 text-amber-800 ring-amber-200",
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  gray: "bg-stone-100 text-stone-600 ring-stone-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  rose: "bg-rose/15 text-rose-dark ring-rose/30",
};

/** פנייה חדשה בלי אחראית יותר מ-24 שעות (PRD 5.6) */
export function isStale(t: { status: TicketStatus; assigned_to: string | null; created_at: string }) {
  return t.status === "new" && !t.assigned_to && Date.now() - new Date(t.created_at).getTime() > 24 * 3600e3;
}
