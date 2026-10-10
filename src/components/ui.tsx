import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { TONE_CLASS, type Tone } from "@/lib/labels";

export const inputClass =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/25 disabled:bg-stone-50";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60";
export const btn = {
  primary: `${btnBase} bg-rose text-white hover:bg-rose-dark`,
  secondary: `${btnBase} border border-line bg-white text-ink hover:bg-sand`,
  danger: `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`,
  ghost: `${btnBase} text-ink hover:bg-sand`,
};

export function SubmitButton({ pending, children, className = "" }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={`${btn.primary} ${className}`}>
      {pending ? "שומרת…" : children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link {...props} className={`${btn[variant]} ${className}`} />;
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}

/** מסנן בצורת "גלולה" – קישור ששומר על שאר הפרמטרים */
export function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm transition ${
        active ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-sand"
      }`}
    >
      {children}
    </Link>
  );
}
