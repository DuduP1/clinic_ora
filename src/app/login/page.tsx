import Image from "next/image";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme";

export const metadata = { title: "כניסה · קליניקת אורה" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <ThemeToggle className="absolute top-4 left-4" />
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1>
            {/* בתצוגה כהה – גרסה מוארת של הלוגו, כדי שהכיתוב יישאר קריא */}
            <Image src="/logo-full.png" alt="קליניקת אורה" width={398} height={263} priority className="mx-auto h-auto w-56 dark:hidden" />
            <Image src="/logo-full-dark.png" alt="קליניקת אורה" width={398} height={263} priority className="mx-auto hidden h-auto w-56 dark:block" />
          </h1>
          <p className="mt-2 text-sm text-muted">מערכת ניהול לקוחות</p>
        </div>
        {error === "inactive" && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">המשתמשת אינה פעילה במערכת.</p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
