# CLAUDE.md – CRM קליניקת אורה

@AGENTS.md

## מטרת הפרויקט
מערכת CRM פנימית לקליניקת אורה (רפואה אסתטית, הרצליה) עבור הצוות: רותם (מנהלת), ליאת ונטע (צוות).
ניהול לקוחות, תורים, פניות שירות ומסך סיכום ניהולי, וכן API מאובטח לסוכן שירות AI.
**מסמך האפיון המחייב:** `../PRD - קליניקת אורה.md`. כל שינוי בהתנהגות חייב להתאים ל-PRD, ואם לא, יש לעדכן את ה-PRD קודם.

## סטאק
- **Next.js 16** (App Router, TypeScript, `src/`). זו לא הגרסה שאתה מכיר: לפני כתיבת קוד קרא את `node_modules/next/dist/docs/`.
  - Middleware נקרא היום **Proxy**, והקובץ הוא `src/proxy.ts`.
  - `cookies()`, `params` ו-`searchParams` הם אסינכרוניים.
  - `cacheComponents` כבוי במכוון: כל המסכים דינמיים לפי המשתמשת המחוברת.
- **Supabase**: Postgres, Auth ו-RLS. ספריות `@supabase/ssr` ו-`@supabase/supabase-js`.
- **Tailwind CSS v4.**
- **Vercel** לפריסה, ו-**GitHub** לניהול גרסאות.

## מבנה תיקיות
```
src/
  app/
    login/              מסך כניסה (ציבורי)
    (app)/              כל המסכים המוגנים, עם layout של ניווט
      page.tsx          מסך ראשי
      customers/        רשימה + [id] כרטיס לקוחה
      appointments/
      tickets/
      staff/            ניהול צוות (admin בלבד)
    api/agent/          נקודות קצה לסוכן AI (אימות x-api-key)
  components/           רכיבי UI משותפים
  lib/
    supabase/           server.ts / client.ts / admin.ts
    phone.ts            נרמול טלפון (מקור אמת יחיד בצד האפליקציה)
    labels.ts           תוויות עברית לסטטוסים
  proxy.ts              רענון session והפניה ל-login
supabase/
  migrations/           SQL ממוספר: סכמה, RLS, פונקציות
  seed.sql              מחירון טיפולים + נתוני דמו
```

## כללי פיתוח
1. **עבודה בשלבים לפי `docs/PLAN.md`.** שלב אחד בכל פעם, ובסוף כל שלב commit עם הודעה ברורה.
2. **אבטחה תחילה:**
   - ההרשאות נאכפות ב-**RLS** במסד הנתונים, לא רק בממשק.
   - מפתח `SUPABASE_SECRET_KEY` משמש **רק** בצד שרת (`lib/supabase/admin.ts`, `api/agent/*`). אסור לייבא אותו לרכיב לקוח.
   - אסור לכתוב מפתחות בקוד, ב-commit או בהודעות. משתנים נשמרים ב-`.env.local` (לא נכנס ל-git) וב-Vercel Environment Variables. התבנית נמצאת ב-`.env.example`.
3. **מוטציות** נעשות דרך Server Actions (`'use server'`), עם ולידציה בשרת. אחרי כל פעולה `revalidatePath` והחזרת `{ ok, error }` לתצוגת toast.
4. **טלפון:**
   - כל טלפון עובר `normalizePhone` לפני חיפוש או שמירה.
   - הפורמט הקנוני הוא ספרות בלבד עם 0 מוביל: `0547821390`.
   - ב-DB יש פונקציה זהה, `normalize_phone`.
5. **סטטוסים:** ב-DB באנגלית, ובממשק בעברית דרך `lib/labels.ts`.
   - תורים: `scheduled` / `completed` / `cancelled`, כלומר עתידי / בוצע / בוטל.
   - פניות: `new` / `in_progress` / `closed`, כלומר חדשה / בטיפול / נסגרה.
6. **אטומיות:** פעולה שנוגעת בכמה טבלאות (למשל פנייה מהסוכן) מתבצעת בפונקציית Postgres אחת (RPC).
7. **שינויים במסד הנתונים:** רק דרך קובץ migration חדש. אין לערוך migration שכבר הוחל.
8. **לפני commit:** להריץ `npm run lint` ו-`npm run build` ולוודא שהם עוברים.

## עיצוב ושפה
- **שפה:** כל הממשק בעברית, `<html lang="he" dir="rtl">`. הודעות למשתמשת בלשון נקבה, למשל "נסי שוב".
- **גופן:** Heebo (`next/font/google`).
- **פלטת צבעים:** משתמשים רק בטוקנים הסמנטיים שמוגדרים ב-`globals.css`: `cream`, `surface`, `sand`, `ink`, `on-ink`, `muted`, `line`, `rose`, `rose-dark`.
  - אסור להשתמש ב-`bg-white` או בצבע קבוע אחר. במקום זה: `bg-surface`. על רקע `bg-ink` כותבים `text-on-ink`.
  - בהיר: רקע `#FAF7F4`, טקסט `#2E2A28`, צבע ראשי `#B5838D`.
- **תצוגה כהה/בהירה:**
  - כפתור ירח/שמש בכותרת ובמסך הכניסה, שמשנה את `<html data-theme>`.
  - הבחירה נשמרת בעוגייה `theme`, ובלי בחירה התצוגה לפי הגדרת המכשיר.
  - הצבעים מתחלפים דרך משתני CSS, כולל גווני הסטטוסים. אין צורך ב-`dark:` ברוב המקרים.
- **צבעי סטטוס:** כחול = עתידי/חדשה, כתום = בטיפול, ירוק = בוצע/נסגרה, אפור = בוטל, אדום = התראה.
- **Mobile-first:**
  - בנייד, טבלאות מוצגות ככרטיסים.
  - יעד מגע של 44px לפחות.
  - ניווט תחתון בנייד, ותפריט צד מימין במחשב.
- **פורמטים:** תאריכים `DD/MM/YYYY`, שעות בפורמט 24 שעות, אזור זמן `Asia/Jerusalem`.
- **עקביות:** כל מסך בנוי לפי התבנית: כותרת, מסננים, רשימה, וכפתור פעולה ראשי.

## פקודות
- `npm run dev`: שרת פיתוח בכתובת http://localhost:3000
- `npm run lint` / `npm run build`: בדיקות לפני commit
- `npx supabase db push`: החלת migrations על פרויקט ה-Supabase המקושר
