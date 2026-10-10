import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme";

export const metadata = { title: "כניסה · קליניקת אורה" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <ThemeToggle className="absolute top-4 left-4" />
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose/15 text-2xl font-bold text-rose-dark">
            א
          </div>
          <h1 className="text-2xl font-bold">קליניקת אורה</h1>
          <p className="text-sm text-muted">מערכת ניהול לקוחות</p>
        </div>
        {error === "inactive" && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">המשתמשת אינה פעילה במערכת.</p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
