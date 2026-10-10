// יצירת משתמשות דמו ונתוני דמו ב-Supabase.
// הרצה: node --env-file=.env.local scripts/seed-demo.mjs
// הסקריפט אידמפוטנטי: משתמשת קיימת לא נוצרת מחדש, ונתוני הדמו נוספים רק כשאין עדיין לקוחות.
// הסיסמאות נכתבות ל-demo-credentials.local.md, שמוחרג מ-git.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("חסרים NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY ב-.env.local");

const db = createClient(url, secret, { auth: { persistSession: false } });
const CRED_FILE = "demo-credentials.local.md";

const STAFF = [
  { key: "rotem", full_name: "רותם ברנע", email: "rotem@clinic-ora.test", role: "admin" },
  { key: "liat", full_name: "ליאת כהן", email: "liat@clinic-ora.test", role: "staff" },
  { key: "neta", full_name: "נטע אדרי", email: "neta@clinic-ora.test", role: "staff" },
];

const newPassword = () => `Ora-${randomBytes(6).toString("base64url")}`;

async function ensureStaff() {
  const known = existsSync(CRED_FILE) ? readFileSync(CRED_FILE, "utf8") : "";
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const ids = {};
  const created = [];

  for (const s of STAFF) {
    let user = list.users.find((u) => u.email === s.email);
    if (!user) {
      const password = newPassword();
      const res = await db.auth.admin.createUser({ email: s.email, password, email_confirm: true });
      if (res.error) throw res.error;
      user = res.data.user;
      created.push({ ...s, password });
    } else if (!known.includes(s.email)) {
      console.warn(`⚠ ${s.email} קיימת אך הסיסמה לא ידועה מקומית`);
    }
    const { error: e2 } = await db.from("staff").upsert(
      { id: user.id, full_name: s.full_name, email: s.email, role: s.role, is_active: true },
      { onConflict: "id" },
    );
    if (e2) throw e2;
    ids[s.key] = user.id;
  }

  if (created.length) {
    const rows = created.map((c) => `| ${c.full_name} | ${c.role === "admin" ? "מנהלת" : "צוות"} | ${c.email} | ${c.password} |`);
    const header = known || "# פרטי התחברות לדמו (מקומי בלבד, לא נכנס ל-git)\n\n| שם | תפקיד | אימייל | סיסמה |\n|---|---|---|---|\n";
    writeFileSync(CRED_FILE, header + rows.join("\n") + "\n");
    console.log(`✓ נוצרו ${created.length} משתמשות. הפרטים נשמרו ב-${CRED_FILE}`);
  }
  return ids;
}

// תאריך יחסי להיום, בשעה מקומית (ישראל, UTC+3 בשעון קיץ / UTC+2 בחורף – לדמו מספיק קירוב דרך Intl)
function at(daysFromToday, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  const ymd = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", timeZoneName: "longOffset" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")
    .value.replace("GMT", "") || "+00:00";
  return new Date(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${offset}`).toISOString();
}

async function seedData(staff) {
  const { count } = await db.from("customers").select("id", { count: "exact", head: true });
  if (count > 0) {
    console.log(`• קיימות כבר ${count} לקוחות – נתוני דמו לא נוספו`);
    return;
  }

  const { data: treatments } = await db.from("treatments").select("id, name");
  const T = Object.fromEntries(treatments.map((t) => [t.name, t.id]));

  const { data: customers, error } = await db
    .from("customers")
    .insert([
      { full_name: "דנה לוי", phone: "054-1234567", notes: "רגישות לחומרי הרדמה מקומית" },
      { full_name: "מיכל אברהם", phone: "+972 52 765 4321" },
      { full_name: "שירה כץ", phone: "050-1112233", notes: "באמצע סדרת לייזר (3/6)" },
      { full_name: "יעל מזרחי", phone: "053-9876543" },
      { full_name: "נועה פרידמן", phone: "058-4445566", notes: "מעדיפה תורים בבוקר" },
      { full_name: "אורית שלום", phone: "052-3332211" },
      { full_name: "תמר גולן", phone: "054-7778899" },
      { full_name: "רוני ביטון", phone: "050-6665544" },
    ])
    .select("id, full_name");
  if (error) throw error;
  const C = Object.fromEntries(customers.map((c) => [c.full_name, c.id]));

  const appts = [
    ["דנה לוי", "טיפול פנים קלאסי", "rotem", -30, "10:00", "completed"],
    ["דנה לוי", "ניקוי פנים עמוק", "rotem", 5, "11:00", "scheduled"],
    ["דנה לוי", "בוטוקס (אזור בודד)", "neta", 2, "15:00", "cancelled"],
    ["מיכל אברהם", "בוטוקס (אזור בודד)", "neta", 0, "12:30", "scheduled"],
    ["שירה כץ", "טיפול לייזר (פנים מלא)", "liat", -21, "09:00", "completed"],
    ["שירה כץ", "טיפול לייזר (פנים מלא)", "liat", -7, "09:00", "completed"],
    ["שירה כץ", "טיפול לייזר (פנים מלא)", "liat", 7, "09:00", "scheduled"],
    ["יעל מזרחי", "התייעצות / טיפול ניסיון", "rotem", 0, "16:00", "scheduled"],
    ["נועה פרידמן", "חומצה היאלורונית (מילוי)", "neta", -3, "10:30", "cancelled"],
    ["אורית שלום", "טיפול פנים קלאסי", "rotem", 1, "13:00", "scheduled"],
    ["תמר גולן", "התייעצות / טיפול ניסיון", "liat", -10, "17:00", "completed"],
  ].map(([c, t, s, day, time, status]) => ({
    customer_id: C[c],
    treatment_id: T[t],
    staff_id: staff[s],
    starts_at: at(day, time),
    status,
  }));
  const { error: e2 } = await db.from("appointments").insert(appts);
  if (e2) throw e2;

  const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
  const tickets = [
    { customer_id: C["דנה לוי"], description: "שאלה לגבי אדמומיות אחרי ניקוי פנים", status: "in_progress", assigned_to: staff.rotem, created_at: hoursAgo(5), source: "manual" },
    { customer_id: C["מיכל אברהם"], description: "מבקשת להקדים את תור הבוטוקס", status: "new", assigned_to: staff.neta, created_at: hoursAgo(2), source: "manual" },
    { customer_id: C["נועה פרידמן"], description: "רוצה לקבוע מחדש אחרי ביטול", status: "new", assigned_to: null, created_at: hoursAgo(30), source: "manual" },
    { customer_id: C["רוני ביטון"], description: "פנייה מאינסטגרם – מחירי טיפולי לייזר", status: "new", assigned_to: null, created_at: hoursAgo(1), source: "agent" },
    { customer_id: C["שירה כץ"], description: "בקשה לקבלה על סדרת הלייזר", status: "in_progress", assigned_to: staff.liat, created_at: hoursAgo(20), source: "manual" },
    { customer_id: C["תמר גולן"], description: "משוב חיובי על טיפול הניסיון", status: "closed", assigned_to: staff.liat, created_at: hoursAgo(200), source: "manual" },
  ];
  const { error: e3 } = await db.from("service_tickets").insert(tickets);
  if (e3) throw e3;

  console.log(`✓ נוספו ${customers.length} לקוחות, ${appts.length} תורים, ${tickets.length} פניות`);
}

const staff = await ensureStaff();
await seedData(staff);
