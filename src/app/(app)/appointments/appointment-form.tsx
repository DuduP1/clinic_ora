"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, Field, inputClass, SubmitButton } from "@/components/ui";
import { APPOINTMENT_STATUS, type AppointmentStatus } from "@/lib/labels";
import type { ActionResult } from "@/lib/auth";

type Option = { id: string; label: string };
type Treatment = { id: string; name: string; price: number; duration_min: number };

export function AppointmentForm({
  action,
  customers,
  treatments,
  staff,
  initial,
  lockCustomer,
  returnTo,
  isNew,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  customers: Option[];
  treatments: Treatment[];
  staff: Option[];
  initial: { customer_id?: string; treatment_id?: string; staff_id?: string | null; date?: string; time?: string; status?: AppointmentStatus; notes?: string | null };
  lockCustomer?: boolean;
  returnTo: string;
  isNew: boolean;
}) {
  const [treatmentId, setTreatmentId] = useState(initial.treatment_id ?? "");
  const t = treatments.find((x) => x.id === treatmentId);

  return (
    <ActionForm action={action}>
      {(pending) => (
        <>
          <input type="hidden" name="return_to" value={returnTo} />
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

          <Field label="סוג טיפול *" hint={t ? `${t.duration_min} דק׳ · ${t.price.toLocaleString("he-IL")} ₪ (לידיעה)` : undefined}>
            <select name="treatment_id" required value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} className={inputClass}>
              <option value="" disabled>
                בחרי טיפול…
              </option>
              {treatments.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="תאריך *">
              <input type="date" name="date" required defaultValue={initial.date} className={inputClass} />
            </Field>
            <Field label="שעה *">
              <input type="time" name="time" required step={900} defaultValue={initial.time} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="מטפלת">
              <select name="staff_id" defaultValue={initial.staff_id ?? ""} className={inputClass}>
                <option value="">—</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="סטטוס">
              {isNew ? (
                <>
                  <input type="hidden" name="status" value="scheduled" />
                  <p className={`${inputClass} flex items-center bg-stone-50`}>{APPOINTMENT_STATUS.scheduled.label}</p>
                </>
              ) : (
                <select name="status" defaultValue={initial.status} className={inputClass}>
                  {(Object.keys(APPOINTMENT_STATUS) as AppointmentStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {APPOINTMENT_STATUS[s].label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field label="הערות" hint="למשל סיבת ביטול">
            <textarea name="notes" rows={2} defaultValue={initial.notes ?? ""} className={inputClass} />
          </Field>

          <div className="flex gap-2 pt-2">
            <SubmitButton pending={pending}>{isNew ? "קביעת תור" : "שמירה"}</SubmitButton>
            <ButtonLink href={returnTo} variant="secondary">
              ביטול
            </ButtonLink>
          </div>
        </>
      )}
    </ActionForm>
  );
}
