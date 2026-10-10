"use client";

import { useRouter } from "next/navigation";

/** מסנן קומפקטי כתיבת בחירה – כל אפשרות היא קישור (הכתובת נבנית בשרת) */
export function FilterSelect({
  label,
  options,
}: {
  label: string;
  options: { label: string; href: string; active: boolean }[];
}) {
  const router = useRouter();
  const current = options.find((o) => o.active) ?? options[0];
  const isFiltered = current !== options[0];

  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={current.href}
        onChange={(e) => router.push(e.target.value)}
        aria-label={label}
        className={`h-9 cursor-pointer appearance-none rounded-full border py-0 pe-3 ps-8 text-sm outline-none transition focus:ring-2 focus:ring-rose/25 ${
          isFiltered ? "border-ink bg-ink text-on-ink" : "border-line bg-surface text-ink hover:bg-sand"
        }`}
      >
        {options.map((o) => (
          <option key={o.href} value={o.href}>
            {o === options[0] ? `${label}: ${o.label}` : o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 ${isFiltered ? "text-on-ink" : "text-muted"}`}
        fill="currentColor"
        aria-hidden
      >
        <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
      </svg>
    </label>
  );
}
