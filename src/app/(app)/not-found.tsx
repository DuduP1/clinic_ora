import { ButtonLink } from "@/components/ui";

/** רשומה שלא נמצאה (למשל לקוחה שנמחקה) */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
      <h1 className="font-display text-2xl">לא מצאנו את מה שחיפשת</h1>
      <p className="mt-1 text-sm text-muted">ייתכן שהרשומה נמחקה או שהקישור שגוי.</p>
      <div className="mt-4 flex justify-center gap-2">
        <ButtonLink href="/">למסך הראשי</ButtonLink>
        <ButtonLink href="/customers" variant="secondary">
          לרשימת הלקוחות
        </ButtonLink>
      </div>
    </div>
  );
}
