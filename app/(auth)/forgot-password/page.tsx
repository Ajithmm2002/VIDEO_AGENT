import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, ForgotForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="Reset your password" footer={<Link href="/login" className="text-accent">Back to sign in</Link>}>
      {isSupabaseConfigured() ? <ForgotForm /> : <p className="text-sm text-muted">Connect Supabase before sending reset emails.</p>}
    </AuthFrame>
  );
}
