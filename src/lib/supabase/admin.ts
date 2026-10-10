import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * לקוח עם המפתח הסודי – עוקף RLS. לשימוש בצד שרת בלבד:
 * API הסוכן וניהול משתמשות (אחרי בדיקת הרשאת מנהלת).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
