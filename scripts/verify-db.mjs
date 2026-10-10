// בדיקות קבלה למסד הנתונים: RLS, אילוצים ופונקציות הסוכן.
// הרצה: node --env-file=.env.local scripts/verify-db.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const creds = Object.fromEntries(
  [...readFileSync("demo-credentials.local.md", "utf8").matchAll(/\| (\S+@\S+) \| (\S+) \|/g)].map((m) => [m[1], m[2]]),
);
let fail = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${extra ? " – " + extra : ""}`); if (!ok) fail++; };

async function as(email) {
  const c = createClient(url, pub, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: creds[email] });
  if (error) throw error;
  return c;
}

// 1. אנונימי – אין גישה
const anon = createClient(url, pub, { auth: { persistSession: false } });
const a1 = await anon.from("customers").select("id");
check("אנונימי לא רואה לקוחות", a1.error || a1.data.length === 0, a1.error?.message ?? `${a1.data?.length} rows`);
const a2 = await anon.rpc("agent_next_appointment", { p_phone: "0541234567" });
check("אנונימי לא מריץ פונקציית סוכן", !!a2.error);

// 2. צוות – רואה, יוצר, לא מוחק
const liat = await as("liat@clinic-ora.test");
const l1 = await liat.from("customers_overview").select("full_name, next_appointment_at, open_tickets");
check("צוות רואה לקוחות (view)", !l1.error && l1.data.length >= 8, l1.error?.message ?? `${l1.data.length} rows`);
const l2 = await liat.from("customers").insert({ full_name: "בדיקה זמנית", phone: "+972-50-000-0001" }).select().single();
check("צוות יוצר לקוחה + נרמול טלפון", !l2.error && l2.data.phone === "0500000001", l2.error?.message ?? l2.data.phone);
const dup = await liat.from("customers").insert({ full_name: "כפילות", phone: "050 000 0001" });
check("טלפון כפול נחסם", dup.error?.code === "23505", dup.error?.code);
const l3 = await liat.from("customers").delete().eq("id", l2.data.id).select();
check("צוות לא יכול למחוק", !l3.error && l3.data.length === 0);
const t1 = await liat.from("service_tickets").insert({ customer_id: l2.data.id, description: "x", status: "in_progress" });
check("'בטיפול' בלי אחראית נחסם", t1.error?.code === "23514", t1.error?.code);
const l4 = await liat.rpc("agent_create_ticket", { p_name: "a", p_phone: "0500000001", p_description: "b" });
check("צוות לא מריץ פונקציית סוכן", !!l4.error);

// 3. מנהלת – מוחקת
const rotem = await as("rotem@clinic-ora.test");
const r1 = await rotem.from("customers").delete().eq("id", l2.data.id).select();
check("מנהלת מוחקת", !r1.error && r1.data.length === 1, r1.error?.message);

// 4. פונקציות הסוכן (מפתח סודי)
const n1 = await admin.rpc("agent_next_appointment", { p_phone: "+972541234567" });
check("התור הבא של דנה (מדלג על בוטל)", !n1.error && n1.data.length === 1 && n1.data[0].treatment_name === "ניקוי פנים עמוק", JSON.stringify(n1.data ?? n1.error));
const n2 = await admin.rpc("agent_next_appointment", { p_phone: "054-7778899" });
check("תמר – אין תור עתידי", !n2.error && n2.data.length === 0);
const n3 = await admin.rpc("agent_next_appointment", { p_phone: "058-4445566" });
check("נועה – רק תור מבוטל → אין תור", !n3.error && n3.data.length === 0);
const c1 = await admin.rpc("agent_create_ticket", { p_name: "שם אחר", p_phone: "0541234567", p_description: "בדיקת סוכן" });
check("פנייה ללקוחה קיימת", !c1.error && c1.data[0].customer_existing === true, JSON.stringify(c1.data ?? c1.error));
const dana = await admin.from("customers").select("full_name").eq("phone", "0541234567").single();
check("שם קיים לא נדרס", dana.data.full_name === "דנה לוי");
const c2 = await admin.rpc("agent_create_ticket", { p_name: "לקוחה חדשה", p_phone: "050-999-8877", p_description: "בדיקה" });
check("פנייה + לקוחה חדשה", !c2.error && c2.data[0].customer_existing === false);
const c3 = await admin.rpc("agent_create_ticket", { p_name: "x", p_phone: "abc", p_description: "y" });
check("טלפון לא תקין נדחה", c3.error?.message === "invalid_phone", c3.error?.message);
const ghost = await admin.from("customers").select("id").eq("full_name", "x");
check("אין לקוחה יתומה אחרי כשל", ghost.data.length === 0);

// ניקוי נתוני הבדיקה
await admin.from("service_tickets").delete().eq("description", "בדיקת סוכן");
const nc = await admin.from("customers").select("id").eq("phone", "0509998877").single();
await admin.from("service_tickets").delete().eq("customer_id", nc.data.id);
await admin.from("customers").delete().eq("id", nc.data.id);

console.log(fail ? `\n${fail} בדיקות נכשלו` : "\nכל הבדיקות עברו");
process.exit(fail ? 1 : 0);
