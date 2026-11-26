"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Eye, EyeOff, Flame, Gauge, Lock, Mail, Sparkles, User } from "lucide-react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand";
import { Button, Field } from "@/components/ui";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function Notice({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "animate-fade-up rounded-xl px-3 py-2 text-sm",
        state.ok ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger",
      )}
    >
      {state.ok ? state.message : state.error}
    </p>
  );
}

/** A text field with an icon, a glowing focus ring, and (for passwords) a show/hide button. */
function IconInput({
  icon: Icon,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <span className="ai-glow relative flex items-center rounded-xl bg-surface">
      <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden />
      <input
        {...props}
        type={isPassword && visible ? "text" : type}
        className="h-12 w-full min-w-0 rounded-xl border-0 bg-transparent pl-10 pr-11 text-base text-ink shadow-none placeholder:text-muted/80 focus-visible:outline-none sm:h-11 sm:text-sm"
      />
      {isPassword ? (
        <button
          type="button"
          className="absolute right-1.5 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : null}
    </span>
  );
}

function SubmitButton({ pending, idle, busy }: { pending: boolean; idle: string; busy: string }) {
  return (
    <Button type="submit" variant="ai" loading={pending} className="mt-1 h-12 w-full text-[15px] sm:h-11">
      {pending ? busy : idle}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <IconInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Password">
        <IconInput icon={Lock} name="password" type="password" autoComplete="current-password" placeholder="Your password" required />
      </Field>
      <Notice state={state} />
      <SubmitButton pending={pending} idle="Sign in" busy="Signing in…" />
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Name">
        <IconInput icon={User} name="displayName" autoComplete="name" placeholder="Your name or channel name" required />
      </Field>
      <Field label="Email">
        <IconInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Password" hint="At least 8 characters, with a letter and a number.">
        <IconInput icon={Lock} name="password" type="password" autoComplete="new-password" placeholder="Create a password" required minLength={8} />
      </Field>
      <Notice state={state} />
      <SubmitButton pending={pending} idle="Create account" busy="Creating account…" />
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Email">
        <IconInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <Notice state={state} />
      <SubmitButton pending={pending} idle="Send reset link" busy="Sending…" />
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="New password" hint="At least 8 characters, with a letter and a number.">
        <IconInput icon={Lock} name="password" type="password" autoComplete="new-password" placeholder="Create a new password" required minLength={8} />
      </Field>
      <Notice state={state} />
      <SubmitButton pending={pending} idle="Update password" busy="Saving…" />
    </form>
  );
}

/** Soft, slowly drifting gradient light used behind the auth pages. */
function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("aurora", className)} aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

/** Small product previews that float, tilt with the pointer, and lift on hover. */
function ShowcaseCard({ className, style, children }: { className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return (
    <div className={cn("float-card absolute", className)} style={style}>
      <div className="lift-card rounded-2xl border border-line/80 bg-surface/90 p-4 shadow-[var(--shadow-lg)] backdrop-blur-md">{children}</div>
    </div>
  );
}

function Showcase() {
  const stage = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={stage}
      className="tilt-stage relative h-[25rem] w-full max-w-md"
      onPointerMove={(event) => {
        const element = stage.current;
        if (!element || event.pointerType !== "mouse") return;
        const box = element.getBoundingClientRect();
        element.style.setProperty("--mx", String(((event.clientX - box.left) / box.width - 0.5) * 2));
        element.style.setProperty("--my", String(((event.clientY - box.top) / box.height - 0.5) * 2));
      }}
      onPointerLeave={() => {
        stage.current?.style.setProperty("--mx", "0");
        stage.current?.style.setProperty("--my", "0");
      }}
      aria-hidden
    >
      <div className="tilt-layer absolute inset-0">
        <ShowcaseCard className="left-0 top-2 w-72" style={{ animationDelay: "0s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[var(--ai-2)]" />
            <span className="ai-text">4 Onam ideas for your channel</span>
          </p>
          <ul className="mt-3 grid gap-2 text-[13px]">
            <li className="rounded-lg bg-surface-2 px-3 py-2 font-medium">Onam sadya: every dish explained</li>
            <li className="rounded-lg bg-surface-2 px-3 py-2 font-medium">Pookalam in 60 seconds</li>
          </ul>
        </ShowcaseCard>

        <ShowcaseCard className="right-0 top-28 w-60" style={{ animationDelay: "-2s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            This week
          </p>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <span key={index} className={cn("rounded-md py-1.5", index === 3 ? "ai-badge font-semibold" : "bg-surface-2")}>
                {day}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[12px] font-medium">Thu · Christmas reel goes live</p>
        </ShowcaseCard>

        <ShowcaseCard className="bottom-6 left-8 w-44" style={{ animationDelay: "-4s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Gauge className="h-3.5 w-3.5" />
            Quality score
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "conic-gradient(var(--ok) 331deg, var(--surface-2) 0deg)" }}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-sm font-bold">92</span>
            </span>
            <span className="text-[12px] font-semibold text-ok">Great</span>
          </div>
        </ShowcaseCard>

        <ShowcaseCard className="bottom-0 right-6 w-48" style={{ animationDelay: "-1s" }}>
          <p className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Flame className="h-3.5 w-3.5 text-warn" />
            Weekly goal
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            3<span className="text-sm font-medium text-muted"> / 3</span>
          </p>
          <p className="text-[12px] font-medium text-warn">4 weeks streak</p>
        </ShowcaseCard>
      </div>
    </div>
  );
}

const subtitles: Record<string, string> = {
  "Sign in": "Welcome back. Pick up where you left off.",
  "Create your workspace": "A private studio for your YouTube and Instagram content.",
  "Reset your password": "We will email you a link to choose a new password.",
  "Choose a new password": "Use at least 8 characters, with a letter and a number.",
};

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
    <main id="main" tabIndex={-1} className="relative grid min-h-screen overflow-hidden bg-bg lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden border-r border-line px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <Aurora />
        <div className="relative z-10">
          <BrandMark href="/" />
        </div>
        <div className="relative z-10 grid gap-8">
          <div className="max-w-lg">
            <h1 className="animate-fade-up text-5xl font-semibold leading-[1.1] tracking-tight">
              Plan your next{" "}
              <span className="sr-only">video</span>
              <span className="word-rotator" aria-hidden>
                <span className="ai-text">reel</span>
                <span className="ai-text">Short</span>
                <span className="ai-text">vlog</span>
              </span>
              <br />
              before you record it.
            </h1>
            <p className="animate-fade-up mt-4 max-w-md text-[15px] leading-7 text-muted" style={{ animationDelay: "120ms" }}>
              Ideas, captions, thumbnail prompts, and a publishing calendar for YouTube and Instagram, with AI that knows your channel.
            </p>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
            <Showcase />
          </div>
        </div>
        <p className="relative z-10 text-sm text-muted">Malayalam and English · Your work stays private to your account</p>
      </section>

      <section className="relative grid place-items-center px-4 py-10 sm:px-8">
        <Aurora className="opacity-60 lg:hidden" />
        <div className="animate-pop-in relative z-10 w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark href="/" />
          </div>
          <div className="rounded-3xl border border-line bg-surface/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {subtitles[title] ? <p className="mt-1.5 text-sm leading-6 text-muted">{subtitles[title]}</p> : null}
            <div className="mt-6">{children}</div>
            <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted [&_a]:font-semibold [&_a]:text-accent [&_a:hover]:underline">
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
