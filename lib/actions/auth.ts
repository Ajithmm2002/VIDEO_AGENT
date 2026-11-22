"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { clientAddress, requestOrigin, requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SESSION_ACTIVE_COOKIE, sessionCookieOptions } from "@/lib/session-timeout";
import { tooManyAttempts } from "@/lib/security/attempts";
import { authSchema, firstIssue, passwordSchema } from "@/lib/validation";
import { safeNextPath } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

function authError(message: string): ActionResult {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return { ok: false, error: "Confirm your email, then sign in." };
  }
  if (lower.includes("invalid login")) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  return { ok: false, error: "Could not complete that request. Try again." };
}

async function limited(action: string, email: string) {
  const address = await clientAddress();
  const normalized = email.trim().toLowerCase().slice(0, 200);
  return (
    tooManyAttempts(`${action}:ip:${address}`, 20) ||
    tooManyAttempts(`${action}:email:${normalized}`, 8)
  );
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Add your Supabase keys in .env.local, then restart the app." };
  }
  const parsed = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Enter your password").max(72),
  }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  if (await limited("sign-in", parsed.data.email)) {
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return authError(error.message);
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signUp(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Add your Supabase keys in .env.local, then restart the app." };
  }
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  if (await limited("sign-up", parsed.data.email)) {
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return authError(error.message);
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "Could not create the account. If you already registered, sign in." };
  }
  if (!data.session) {
    return { ok: true, message: "Check your email to confirm the account, then sign in." };
  }
  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Add your Supabase keys in .env.local, then restart the app." };
  }
  const parsed = z.email("Enter a valid email").safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };
  if (await limited("reset", parsed.data)) {
    return { ok: true, message: "If an account exists for that email, a reset link is on the way." };
  }
  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });
  if (error) return { ok: false, error: "Could not send the reset email. Try again shortly." };
  return { ok: true, message: "If an account exists for that email, a reset link is on the way." };
}

export async function updatePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) {
    return { ok: false, error: "Open the reset link from your email, then choose a new password." };
  }
  const { error } = await session.supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: "Could not update the password. Request a new reset link." };
  redirect("/dashboard");
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  try {
    const store = await cookies();
    store.set(SESSION_ACTIVE_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  } catch {
    // proxy.ts still clears the activity cookie on the next request.
  }
  await supabase.auth.signOut();
  redirect("/login");
}
