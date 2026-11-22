import { cache } from "react";
import { cookies, headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SESSION_ACTIVE_COOKIE, sessionTimeoutReason } from "@/lib/session-timeout";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    if (await expireTimedOutSession(supabase, data.user)) return null;
    return data.user;
  } catch {
    return null;
  }
});

export const requestUserEmail = cache(async () => {
  const headerStore = await headers();
  return headerStore.get("x-user-email");
});

export async function requestOrigin() {
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "").split(",")[0]?.trim() ?? "";
  const proto = headerStore.get("x-forwarded-proto") === "http" ? "http" : "https";
  const localHost = /^(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host);

  if (process.env.NODE_ENV === "production" && host && !localHost && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    return `https://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && isHttpsUrl(configured)) return configured;
  if (configured === "http://localhost:3000" || configured === "http://127.0.0.1:3000") return configured;

  if (localHost) return `http://${host}`;
  if (proto === "https" && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return `https://${host}`;
  return "http://localhost:3000";
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export async function clientAddress() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const address = forwarded || headerStore.get("x-real-ip") || "local";
  return address.slice(0, 80);
}

export async function requireSession() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Add your Supabase keys in .env.local to save data." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, error: "Sign in to continue." };
  }
  if (await expireTimedOutSession(supabase, data.user)) {
    return { ok: false as const, error: "Your session timed out. Sign in again." };
  }
  return { ok: true as const, supabase, user: data.user };
}

async function expireTimedOutSession(supabase: SupabaseClient, user: User) {
  const store = await cookies();
  const reason = sessionTimeoutReason({
    lastSignInAt: user.last_sign_in_at,
    activeAt: store.get(SESSION_ACTIVE_COOKIE)?.value,
  });
  if (!reason) return false;
  try {
    await supabase.auth.signOut();
  } catch {
    // proxy.ts is the primary place cookies are cleared.
  }
  return true;
}
