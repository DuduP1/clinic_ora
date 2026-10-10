# CRM – קליניקת אורה

מערכת ניהול פנימית לקליניקת אורה: ניהול לקוחות, תורים ופניות שירות, ומסך סיכום ניהולי. כוללת גם API מאובטח לסוכן שירות AI.

**סטאק:** Next.js 16 · Supabase (Postgres, Auth, RLS) · Tailwind CSS · Vercel

## מסמכים
- [CLAUDE.md](CLAUDE.md): מטרה, כללי פיתוח, עיצוב ושפה
- [docs/PLAN.md](docs/PLAN.md): תוכנית הבנייה בשלבים

## הרצה מקומית
```bash
npm install
cp .env.example .env.local   # ומלאו את הערכים
npm run dev
```

כל המפתחות נשמרים במשתני סביבה בלבד: `.env.local` במחשב, ו-Environment Variables ב-Vercel. הם לא נשמרים בקוד.
