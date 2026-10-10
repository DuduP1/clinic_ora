"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Field, inputClass, SubmitButton } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="אימייל">
        <input name="email" type="email" required autoComplete="email" dir="ltr" className={inputClass} />
      </Field>
      <Field label="סיסמה">
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" className={inputClass} />
      </Field>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <SubmitButton pending={pending} className="w-full">
        כניסה
      </SubmitButton>
    </form>
  );
}
