import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { TONE_CLASS, type Tone } from "@/lib/labels";
import { Icon, type IconName } from "@/components/icons";

export const inputClass =
  "w-full min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/25 disabled:bg-stone-50";

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
  primary: `${btnBase} bg-primary text-on-primary hover:bg-primary-hover`,
  secondary: `${btnBase} border border-line bg-surface text-ink hover:bg-sand`,
  danger: `${btnBase} border border-red-200 bg-surface text-red-700 hover:bg-red-50`,
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
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[tone]}`}>
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
  return <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>{children}</section>;
}

/** מצב ריק – מסביר מה חסר, ואם יש – מציע את הפעולה הבאה */
export function EmptyState({ children, action }: { children: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
      <p>{children}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block font-medium text-rose-dark hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** מסנן בצורת "גלולה" – קישור ששומר על שאר הפרמטרים */
export function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm transition ${
        active ? "bg-ink text-on-ink" : "border border-line bg-surface text-ink hover:bg-sand"
      }`}
    >
      {children}
    </Link>
  );
}

/** מתג מקטעים קומפקטי – לתצוגה (רשימה/קאנבאן/לוח שנה) ולטווחי זמן */
export function ViewToggle({ options, label = "תצוגה" }: { options: { href: string; label: string; active: boolean; icon?: IconName }[]; label?: string }) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-surface p-0.5" role="tablist" aria-label={label}>
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          role="tab"
          aria-selected={o.active}
          className={`flex h-full items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition ${o.active ? "bg-ink text-on-ink" : "text-ink hover:bg-sand"}`}
        >
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/**
 * סרגל עליון קומפקטי לעמודי רשימה: כותרת + מונה, מסננים, ומשמאל מתג תצוגה וכפתור פעולה.
 * במסך רחב הכול בשורה אחת; בצר – נשבר לשורות קצרות.
 */
export function Toolbar({ title, count, filters, actions }: { title: string; count?: ReactNode; filters?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl font-bold">{title}</h1>
        {count !== undefined && <span className="text-sm text-muted">{count}</span>}
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
