import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, UpdatePasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function UpdatePasswordPage() {
  return (
    <AuthFrame title="Choose a new password" footer={<Link href="/login" className="text-accent">Back to sign in</Link>}>
      <UpdatePasswordForm />
    </AuthFrame>
  );
}
