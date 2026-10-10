import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** רענון session של Supabase בכל בקשה + הפניה ל-login למי שלא מחוברת. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const loggedIn = !!data?.claims?.sub;
  const { pathname } = request.nextUrl;

  if (!loggedIn && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (loggedIn && pathname === "/login" && !request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  // לא רץ על קבצים סטטיים ועל API הסוכן (שמאומת במפתח משלו)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/agent|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
