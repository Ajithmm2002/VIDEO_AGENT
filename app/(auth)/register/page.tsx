import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, RegisterForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthFrame title="Create your workspace" footer={<Link href="/login" className="text-accent">Already have an account? Sign in</Link>}>
      {isSupabaseConfigured() ? (
        <RegisterForm />
      ) : (
        <div className="rounded-2xl bg-surface-2/80 p-4 text-sm leading-6 text-muted">
          Connect Supabase in <span className="font-medium text-ink">.env.local</span> before creating an account. Each person who registers gets a private workspace.
        </div>
      )}
    </AuthFrame>
  );
}
