import { normalizePhone } from "@/lib/phone";

/** וואטסאפ דורש מספר בינלאומי בלי 0 מוביל: 0541234567 → 972541234567 */
function waNumber(phone: string) {
  const n = normalizePhone(phone);
  return n.startsWith("0") ? `972${n.slice(1)}` : n;
}

const ICONS = {
  call: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  whatsapp: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a5 5 0 0 1-2.2-2.2l.8-1-1-2z",
};

/** כפתורי פעולה מהירים מתחת לשם הלקוחה: חיוג ו-WhatsApp */
export function ContactActions({ phone }: { phone: string }) {
  const actions = [
    { href: `tel:${normalizePhone(phone)}`, label: "חיוג", icon: ICONS.call, external: false },
    { href: `https://wa.me/${waNumber(phone)}`, label: "WhatsApp", icon: ICONS.whatsapp, external: true },
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {actions.map((a) => (
        <a
          key={a.label}
          href={a.href}
          {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm font-medium text-ink transition hover:border-rose/50 hover:bg-sand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-dark" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={a.icon} />
          </svg>
          {a.label}
        </a>
      ))}
    </div>
  );
}
