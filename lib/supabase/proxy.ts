import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from "@/lib/env";
import {
  SESSION_ACTIVE_COOKIE,
  sessionCookieOptions,
  sessionTimeoutReason,
} from "@/lib/session-timeout";
import { safeNextPath } from "@/lib/utils";

const protectedPrefixes = [
  "/dashboard",
  "/content",
  "/planner",
  "/calendar",
  "/library",
  "/thumbnails",
  "/assistant",
  "/hashtags",
  "/affiliate",
  "/settings",
  "/profile",
  "/marketplace",
  "/purchases",
  "/play",
  "/admin",
  "/api",
];

function isProtected(pathname: string) {
  if (pathname === "/api/support") return false;
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

function stampSessionCookies(response: NextResponse) {
  response.cookies.set(SESSION_ACTIVE_COOKIE, String(Date.now()), sessionCookieOptions());
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(SESSION_ACTIVE_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

function loginExpiredUrl(request: NextRequest, nextPath?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("session", "expired");
  if (nextPath) url.searchParams.set("next", nextPath);
  return url;
}

function withRequestHeaders(request: NextRequest, email: string | null) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-email");
  if (email) requestHeaders.set("x-user-email", email);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-email");
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  const supabase = createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
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
  let user = data.user;
  const { pathname } = request.nextUrl;
  const authPage = pathname === "/login" || pathname === "/register";
  let timedOut = false;

  if (user) {
    const activeAt = request.cookies.get(SESSION_ACTIVE_COOKIE)?.value ?? null;
    if (sessionTimeoutReason({ lastSignInAt: user.last_sign_in_at, activeAt })) {
      await supabase.auth.signOut();
      clearSessionCookies(response);
      timedOut = true;
      user = null;
    }
  }

  if (!user && isProtected(pathname)) {
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const url = timedOut ? loginExpiredUrl(request, nextPath) : request.nextUrl.clone();
    if (!timedOut) {
      url.pathname = "/login";
      url.searchParams.set("next", nextPath);
    }
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (timedOut && pathname === "/login" && request.nextUrl.searchParams.get("session") !== "expired") {
    return copyCookies(response, NextResponse.redirect(loginExpiredUrl(request)));
  }

  if (user && authPage) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath("/dashboard");
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  const next = copyCookies(response, withRequestHeaders(request, user?.email ?? null));
  if (user) stampSessionCookies(next);
  return next;
}
