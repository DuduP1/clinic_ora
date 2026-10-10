import Link from "next/link";
import type { ReactNode } from "react";
import { requireStaff } from "@/lib/auth";
import { ymdInTz } from "@/lib/dates";
import { SHORTCUTS, type Shortcut } from "@/lib/shortcuts";
import { Badge } from "@/components/ui";

export const metadata = { title: "עזרה · קליניקת אורה" };

const SECTIONS = [
  { id: "start", title: "התחלה מהירה" },
  { id: "call", title: "לקוחה מתקשרת – מה עושים" },
  { id: "screens", title: "המסכים" },
  { id: "tickets", title: "פניות שירות" },
  { id: "appointments", title: "תורים" },
  { id: "roles", title: "הרשאות" },
  { id: "shortcuts", title: "קיצורי מקלדת" },
  { id: "tips", title: "טיפים" },
  { id: "about", title: "אודות" },
];

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-line border-b-2 bg-surface px-1.5 py-0.5 font-sans text-xs font-semibold text-ink" dir="ltr">
      {children}
    </kbd>
  );
}

function Keys({ combos }: { combos: Shortcut["keys"] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {combos.map((combo, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="mx-0.5 text-xs text-muted">או</span>}
          {combo.map((k, j) => (
            <span key={j} className="inline-flex items-center gap-1">
              {j > 0 && <span className="text-xs text-muted">{combo[0] === "G" ? "ואז" : "+"}</span>}
              <Kbd>{k}</Kbd>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    // העוגן על הכרטיס כולו; scroll-margin = גובה הכותרת הדביקה (61px) + מרווח, כדי שהכותרת לא תוסתר
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-[4.75rem] rounded-2xl border border-line bg-surface p-4 shadow-sm transition-shadow duration-700 target:ring-2 target:ring-rose/50 sm:p-5"
    >
      <h2 id={`${id}-title`} className="mb-3 text-lg font-bold">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default async function HelpPage() {
  const me = await requireStaff();
  const groups = ["כללי", "ניווט", "פעולות"] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
      {/* תוכן עניינים */}
      <nav aria-label="תוכן העזרה" className="lg:sticky lg:top-20">
        <h1 className="mb-2 text-xl font-bold">עזרה ומדריך</h1>
        <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-sm text-ink hover:bg-sand max-lg:border max-lg:border-line max-lg:bg-surface">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4 pb-[60dvh]">
        <Section id="start" title="התחלה מהירה">
          <p>
            המערכת מרכזת במקום אחד את <b>הלקוחות</b>, <b>התורים</b> ו<b>פניות השירות</b> של הקליניקה. כל לקוחה מזוהה לפי מספר הטלפון שלה, ואין
            כפילויות.
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <b>חיפוש מהיר</b> נמצא בראש כל מסך. מקלידים טלפון (בכל פורמט: <span dir="ltr">054-1234567</span>, <span dir="ltr">+972541234567</span>) או
              שם. טלפון מלא פותח ישר את כרטיס הלקוחה.
            </li>
            <li>
              <b>ניווט:</b> במחשב בתפריט מימין, ובנייד בסרגל התחתון.
            </li>
            <li>
              <b>תצוגה כהה/בהירה:</b> כפתור הירח/שמש ליד השם. הבחירה נשמרת.
            </li>
          </ul>
        </Section>

        <Section id="call" title="לקוחה מתקשרת – מה עושים">
          <ol className="list-decimal space-y-1.5 ps-5">
            <li>
              לוחצים <Kbd>/</Kbd> (או על שדה החיפוש) ומקלידים את מספר הטלפון.
            </li>
            <li>
              <b>הלקוחה קיימת?</b> נפתח הכרטיס שלה, עם התור הבא, היסטוריית התורים והפניות.
            </li>
            <li>
              <b>לא קיימת?</b> לוחצים &quot;ליצירת לקוחה חדשה&quot;. הטלפון כבר ממולא בטופס.
            </li>
            <li>
              מתוך הכרטיס לוחצים <b>+ קביעת תור</b> או <b>+ פתיחת פנייה</b>. הלקוחה כבר מקושרת, ולא צריך לבחור אותה שוב.
            </li>
          </ol>
        </Section>

        <Section id="screens" title="המסכים">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["מסך ראשי", "מונים (פניות חדשות, בטיפול, ללא אחראית, תורים היום), פניות פתוחות לפי אחראית ורשימת התורים של היום. לחיצה על מונה או שורה פותחת את הרשימה המסוננת."],
              ["לקוחות", "רשימת כל הלקוחות עם התור הבא ומספר הפניות הפתוחות. לחיצה על שם פותחת את כרטיס הלקוחה."],
              ["כרטיס לקוחה", "פרטים, הערות פנימיות (רגישויות, העדפות), התור הבא מודגש, היסטוריית תורים ופניות. מכאן קובעים תור ופותחים פנייה."],
              ["תורים", "תצוגת רשימה (עתידיים / היום / השבוע / הכול) או לוח שנה חודשי. מסננים לפי סטטוס ומטפלת."],
              ["פניות שירות", "תצוגת רשימה או קאנבאן. מסננים לפי סטטוס ואחראית, וכפתור \"הפניות שלי\"."],
              ["ניהול צוות", "מנהלת בלבד: הוספת משתמשת, שינוי תפקיד והשבתה."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-sand/50 p-3">
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-0.5 text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="tickets" title="פניות שירות">
          <p className="flex flex-wrap items-center gap-2">
            מחזור החיים: <Badge tone="blue">חדשה</Badge> ← <Badge tone="orange">בטיפול</Badge> ← <Badge tone="green">נסגרה</Badge>
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              כדי להעביר פנייה ל<b>בטיפול</b> חייבת להיות לה <b>אחראית</b>. הכפתור <b>&quot;אני לוקחת&quot;</b> משייך את הפנייה אלייך ומעביר אותה לבטיפול
              בלחיצה אחת.
            </li>
            <li>
              <b>בקאנבאן</b> גוררים כרטיס בין העמודות (במחשב) או משתמשים בכפתורי ההעברה שעל הכרטיס (בנייד). העברה ל&quot;בטיפול&quot; של פנייה בלי
              אחראית משייכת אותה אוטומטית למי שהעבירה.
            </li>
            <li>
              פנייה <Badge tone="red">ללא שיוך מעל 24 שעות</Badge> מסומנת באדום, וגם מופיעה כהתראה במסך הראשי.
            </li>
            <li>
              פניות שפתח סוכן ה-AI מסומנות ב-<Badge tone="rose">🤖 סוכן AI</Badge>. הן מגיעות כ&quot;חדשה&quot; ללא אחראית.
            </li>
            <li>אפשר לפתוח מחדש פנייה שנסגרה. היא חוזרת לבטיפול.</li>
          </ul>
        </Section>

        <Section id="appointments" title="תורים">
          <p className="flex flex-wrap items-center gap-2">
            סטטוסים: <Badge tone="blue">עתידי</Badge> <Badge tone="green">בוצע</Badge> <Badge tone="gray">בוטל</Badge>
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              אחרי טיפול מסמנים <b>✓ בוצע</b>. בביטול או בהברזה מסמנים <b>בוטל</b>, ואת הסיבה כותבים בהערות (דרך &quot;עריכה&quot;).
            </li>
            <li>
              <b>לוח שנה:</b> מדפדפים בחצים בין חודשים, ו&quot;היום&quot; מחזיר לחודש הנוכחי. לחיצה על יום מציגה את התורים שלו, עם כפתור <b>+ תור ביום זה</b>
              {" "}שממלא את התאריך מראש.
            </li>
            <li>
              <b>התור הבא</b> של לקוחה הוא תור עתידי שזמנו טרם הגיע. תורים שבוטלו לא נחשבים.
            </li>
          </ul>
        </Section>

        <Section id="roles" title="הרשאות">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-right text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 font-medium">פעולה</th>
                  <th className="py-2 text-center font-medium">מנהלת</th>
                  <th className="py-2 text-center font-medium">צוות</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["צפייה, יצירה ועדכון של לקוחות, תורים ופניות", true, true],
                  ["שיוך פנייה לאחראית", true, true],
                  ["מחיקת רשומות", true, false],
                  ["ניהול צוות", true, false],
                ].map(([a, admin, staff]) => (
                  <tr key={String(a)} className="border-b border-line last:border-0">
                    <td className="py-2">{a}</td>
                    <td className="py-2 text-center">{admin ? "✓" : "—"}</td>
                    <td className="py-2 text-center">{staff ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted">
            את מחוברת כ<b>{me.role === "admin" ? "מנהלת" : "צוות"}</b>.
          </p>
        </Section>

        <Section id="shortcuts" title="קיצורי מקלדת">
          <p className="text-muted">
            הקיצורים עובדים במחשב, <b>גם כשהמקלדת בעברית</b>. הם לא פועלים בזמן הקלדה בתוך שדה (חוץ מ-<Kbd>Esc</Kbd> ו-<Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>).
          </p>
          {groups.map((g) => (
            <div key={g}>
              <h3 className="mb-1 mt-2 text-xs font-semibold tracking-wide text-muted">{g}</h3>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.description} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <span>{s.description}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Keys combos={s.keys} />
                      {s.he && <span className="text-xs text-muted" dir="auto">({s.he})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="tips" title="טיפים">
          <ul className="list-disc space-y-1 ps-5">
            <li>אם שמירה נכשלת, הנתונים שהוקלדו נשארים בטופס. אפשר פשוט לנסות שוב.</li>
            <li>לא ניתן ליצור שתי לקוחות עם אותו טלפון. המערכת תציע קישור לכרטיס הקיים.</li>
            <li>במסך הראשי, לחיצה על מונה פותחת את הרשימה המסוננת המתאימה.</li>
            <li>
              שאלות נוספות? פני ל{me.role === "admin" ? "תמיכה הטכנית" : "רותם"}. <Link href="/" className="text-rose-dark hover:underline">חזרה למסך הראשי</Link>
            </li>
          </ul>
        </Section>

        <Section id="about" title="אודות">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose/15 text-2xl font-bold text-rose-dark">א</span>
            <div>
              <p className="text-base font-semibold">CRM קליניקת אורה</p>
              <p className="text-muted">מערכת לניהול לקוחות, תורים ופניות שירות · גרסה 1.0</p>
            </div>
          </div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted">פיתוח ובנייה</dt>
            <dd className="font-semibold">דודו פורת</dd>
            <dt className="text-muted">במסגרת</dt>
            <dd>פרויקט הגמר של הכשרת מפתחי AI · בינה פלוס</dd>
            <dt className="text-muted">טכנולוגיות</dt>
            <dd dir="ltr" className="text-right">Next.js · Supabase · Tailwind CSS · Vercel</dd>
            <dt className="text-muted">כלי פיתוח</dt>
            <dd dir="ltr" className="text-right">Claude Code</dd>
            <dt className="text-muted">קוד מקור</dt>
            <dd>
              <a href="https://github.com/DuduP1/clinic_ora" target="_blank" rel="noreferrer" className="text-rose-dark hover:underline" dir="ltr">
                github.com/DuduP1/clinic_ora
              </a>
            </dd>
          </dl>
          <p className="text-xs text-muted">© {ymdInTz().slice(0, 4)} דודו פורת. כל הזכויות שמורות.</p>
        </Section>
      </div>
    </div>
  );
}
