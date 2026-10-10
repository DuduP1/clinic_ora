"use client";

import { ActionForm } from "@/components/action-form";
import { Field, inputClass, SubmitButton, ButtonLink } from "@/components/ui";
import type { ActionResult } from "@/lib/auth";

type Customer = { full_name: string; phone: string; notes: string | null };

export function CustomerForm({
  action,
  initial,
  cancelHref,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  initial?: Partial<Customer>;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action}>
      {(pending) => (
        <>
          <Field label="שם מלא *">
            <input name="full_name" required defaultValue={initial?.full_name} className={inputClass} autoComplete="off" />
          </Field>
          <Field label="טלפון *" hint="כל פורמט: 054-1234567, ‎+972541234567 – המערכת מנרמלת אוטומטית">
            <input name="phone" required inputMode="tel" dir="ltr" defaultValue={initial?.phone} className={`${inputClass} text-right`} />
          </Field>
          <Field label="הערות פנימיות" hint="רגישויות, העדפות, המלצה לטיפול המשך – גלוי לצוות בלבד">
            <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} className={inputClass} />
          </Field>
          <div className="flex gap-2 pt-2">
            <SubmitButton pending={pending}>שמירה</SubmitButton>
            <ButtonLink href={cancelHref} variant="secondary">
              ביטול
            </ButtonLink>
          </div>
        </>
      )}
    </ActionForm>
  );
}
