/**
 * נרמול טלפון – זהה ל-public.normalize_phone ב-DB.
 * "+972-54-782-1390" → "0547821390"
 */
export function normalizePhone(input: string | null | undefined): string {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return "0" + digits.slice(3);
  if (digits.startsWith("0")) return digits;
  return "0" + digits;
}

export function isValidPhone(normalized: string): boolean {
  return /^0\d{8,9}$/.test(normalized);
}

/** תצוגה: 0547821390 → 054-782-1390 */
export function formatPhone(phone: string): string {
  if (/^05\d{8}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  if (/^0\d{8}$/.test(phone)) return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
  return phone;
}
