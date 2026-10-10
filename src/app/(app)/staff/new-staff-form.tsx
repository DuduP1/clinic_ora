"use client";

import { ActionForm } from "@/components/action-form";
import { Field, inputClass, SubmitButton } from "@/components/ui";
import { createStaff } from "./actions";

export function NewStaffForm() {
  return (
    <ActionForm action={createStaff}>
      {(pending) => (
        <>
          <Field label="שם מלא *">
            <input name="full_name" required className={inputClass} />
          </Field>
          <Field label="אימייל *">
            <input name="email" type="email" required dir="ltr" className={inputClass} />
          </Field>
          <Field label="סיסמה זמנית *" hint="לפחות 8 תווים. מסרי אותה לעובדת בעל־פה.">
            <input name="password" type="text" required minLength={8} dir="ltr" autoComplete="off" className={inputClass} />
          </Field>
          <Field label="תפקיד">
            <select name="role" defaultValue="staff" className={inputClass}>
              <option value="staff">צוות</option>
              <option value="admin">מנהלת</option>
            </select>
          </Field>
          <SubmitButton pending={pending} className="w-full">הוספה</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
