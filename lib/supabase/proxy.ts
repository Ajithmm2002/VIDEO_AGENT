import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";

const protectedPrefixes = [
  "/dashboard",
  "/content",
  "/calendar",
  "/library",
  "/thumbnails",
  "/assistant",
  "/hashtags",
  "/settings",
  "/api",
];

function isProtected(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  const cookies = from.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    to.headers.append("set-cookie", cookie);
  }
  return to;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "<!doctype html><html lang=\"en\"><body style=\"font-family:sans-serif;padding:2rem\"><h1>Content Studio is not ready</h1><p>Add the Supabase URL and publishable key in the host environment, then redeploy.</p></body></html>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
      );
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { pathname } = request.nextUrl;
  const authPage = pathname === "/login" || pathname === "/register";

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && authPage) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath("/dashboard");
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}
