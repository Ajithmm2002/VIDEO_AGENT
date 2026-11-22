import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, LoginForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";
import { SESSION_IDLE_DAYS, SESSION_MAX_AGE_DAYS } from "@/lib/session-timeout";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; session?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <AuthFrame
      title="Sign in"
      footer={
        <>
          <Link href="/register" className="text-accent">Create an account</Link>
          <span> · </span>
          <Link href="/forgot-password" className="text-accent">Forgot password</Link>
        </>
      }
    >
      {params.session === "expired" ? (
        <p className="mb-3 text-sm text-danger">
          Your session ended after {SESSION_MAX_AGE_DAYS} days, or after {SESSION_IDLE_DAYS} days without a visit. Sign in again.
        </p>
      ) : null}
      {params.error ? <p className="mb-3 text-sm text-danger">The sign-in link expired. Request a new one.</p> : null}
      {isSupabaseConfigured() ? <LoginForm next={next} /> : <SetupNeeded />}
    </AuthFrame>
  );
}

function SetupNeeded() {
  return (
    <div className="rounded-2xl bg-surface-2/80 p-4 text-sm leading-6 text-muted">
      Add the Supabase URL and publishable key to <span className="font-medium text-ink">.env.local</span>, then restart the app. Until then, thumbnail prompts and writing drafts still work from the dashboard.
    </div>
  );
}
