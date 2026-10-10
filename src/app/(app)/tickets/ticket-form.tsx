"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Field, inputClass, SubmitButton } from "@/components/ui";
import { TICKET_STATUS, type TicketStatus } from "@/lib/labels";
import type { ActionResult } from "@/lib/auth";

type Option = { id: string; label: string };

export function TicketForm({
  action,
  customers,
  staff,
  initial,
  lockCustomer,
  cancelHref,
  isNew,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  customers: Option[];
  staff: Option[];
  initial: { customer_id?: string; description?: string; status?: TicketStatus; assigned_to?: string | null };
  lockCustomer?: boolean;
  cancelHref: string;
  isNew: boolean;
}) {
  const [status, setStatus] = useState<TicketStatus>(initial.status ?? "new");
  const [assignee, setAssignee] = useState(initial.assigned_to ?? "");
  const needsAssignee = status === "in_progress" && !assignee;

  return (
    <ActionForm action={action}>
      {(pending) => (
        <>
          <Field label="לקוחה *">
            {lockCustomer ? (
              <>
                <input type="hidden" name="customer_id" value={initial.customer_id} />
                <p className={`${inputClass} flex items-center bg-stone-50`}>{customers.find((c) => c.id === initial.customer_id)?.label}</p>
              </>
            ) : (
              <select name="customer_id" required defaultValue={initial.customer_id ?? ""} className={inputClass}>
                <option value="" disabled>
                  בחרי לקוחה…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="תיאור הפנייה *">
            <textarea name="description" required rows={4} defaultValue={initial.description} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="סטטוס">
              <select name="status" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={inputClass}>
                {(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={status === "in_progress" ? "אחראית *" : "אחראית"}>
              <select
                name="assigned_to"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={`${inputClass} ${needsAssignee ? "border-red-400 ring-2 ring-red-200" : ""}`}
              >
                <option value="">ללא שיוך</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {needsAssignee && <p className="text-sm text-red-700">יש לבחור אחראית לפני מעבר לבטיפול</p>}

          <div className="flex gap-2 pt-2">
            <SubmitButton pending={pending}>{isNew ? "פתיחת פנייה" : "שמירה"}</SubmitButton>
            <ButtonLink href={cancelHref} variant="secondary">
              ביטול
            </ButtonLink>
          </div>
        </>
      )}
    </ActionForm>
  );
}
