import type { CookieOptions } from "@supabase/ssr";
type CookieToSet = { name: string; value: string; options: CookieOptions };
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase session cookie on every request. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items: CookieToSet[]) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}
