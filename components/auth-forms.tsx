"use client";

import { useActionState } from "react";
import { CalendarDays, ImageIcon, PenLine } from "lucide-react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand";
import { Button, Card, Field, TextInput } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

function Notice({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email"><TextInput name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password"><TextInput name="password" type="password" autoComplete="current-password" required /></Field>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Name"><TextInput name="displayName" autoComplete="name" required /></Field>
      <Field label="Email"><TextInput name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" hint="At least 8 characters, with a letter and a number.">
        <TextInput name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Email"><TextInput name="email" type="email" autoComplete="email" required /></Field>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="New password" hint="At least 8 characters, with a letter and a number.">
        <TextInput name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Notice state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Update password"}</Button>
    </form>
  );
}

const highlights = [
  { icon: ImageIcon, title: "Thumbnail prompts", body: "Landscape and vertical prompts ready for Google Flow." },
  { icon: PenLine, title: "Writing drafts", body: "Titles, captions, tags, and a script outline in Malayalam or English." },
  { icon: CalendarDays, title: "A quiet calendar", body: "Drag ideas onto a day and keep each account private." },
];

export function AuthFrame({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden px-12 py-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <BrandMark href="/" />
        <div className="max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Personal workspace</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance">Plan the next video before you record it.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted">
            Keep YouTube and Instagram ideas, prompts, and publishing dates in one private studio.
          </p>
          <div className="mt-10 grid gap-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-line/70 bg-surface/70 p-4 backdrop-blur-sm">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{item.body}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-sm text-muted">Malayalam and English. Your rows stay on your account.</p>
      </section>
      <section className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-md">
          <div className="lg:hidden">
            <BrandMark href="/" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight lg:mt-0">{title}</h1>
          <div className="mt-6">{children}</div>
          <div className="mt-5 text-sm text-muted">{footer}</div>
        </Card>
      </section>
    </main>
  );
}
