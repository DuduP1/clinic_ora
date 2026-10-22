import Image from "next/image";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme";

export const metadata = { title: "כניסה · קליניקת אורה" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* צד המותג: אספרסו עם הלוגו בזהב */}
      <section className="flex flex-col items-center justify-center gap-3 border-b border-line bg-shell px-6 py-10 text-on-shell md:border-b-0 md:border-l md:py-0">
        <h1>
          {/* בתצוגה כהה – גרסה מוארת של הלוגו */}
          <Image src="/logo-full.png" alt="קליניקת אורה" width={398} height={263} priority className="h-auto w-48 md:w-72 dark:hidden" />
          <Image src="/logo-full-dark.png" alt="קליניקת אורה" width={398} height={263} priority className="hidden h-auto w-48 md:w-72 dark:block" />
        </h1>
        <p className="text-sm text-on-shell-muted">מערכת ניהול לקוחות · לצוות הקליניקה</p>
      </section>

      <section className="relative flex items-center justify-center p-6">
        <ThemeToggle className="absolute top-4 left-4" />
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl">כניסה</h2>
          <p className="mt-1 mb-6 text-sm text-muted">התחברי עם האימייל והסיסמה שלך.</p>
          {error === "inactive" && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">המשתמשת אינה פעילה במערכת.</p>
          )}
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
