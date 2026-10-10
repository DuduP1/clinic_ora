import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "קליניקת אורה · CRM",
  description: "מערכת ניהול לקוחות, תורים ופניות שירות לקליניקת אורה",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#171413" },
  ],
};

// אם המשתמשת עוד לא בחרה – לפי הגדרת המכשיר, לפני הציור הראשון (בלי הבהוב)
const systemThemeScript = `if(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "dark" || saved === "light" ? saved : undefined;

  return (
    <html lang="he" dir="rtl" data-theme={theme} suppressHydrationWarning className={`${heebo.variable} h-full antialiased`}>
      <head>{!theme && <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />}</head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
