import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/** אימות כותרת x-api-key מול AGENT_API_KEY (השוואה בזמן קבוע). */
export function isAuthorized(request: Request): boolean {
  const expected = process.env.AGENT_API_KEY;
  const got = request.headers.get("x-api-key");
  if (!expected || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const unauthorized = () => json({ ok: false, error: "unauthorized" }, 401);
