import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { tagCountOptions } from "@/lib/types";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem] sm:leading-9">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

const buttonStyles = {
  primary: "bg-accent text-accent-ink shadow-[var(--shadow-glow)] hover:bg-accent-2",
  secondary: "border border-line bg-surface text-ink shadow-[var(--shadow)] hover:border-line-strong hover:bg-surface-2",
  danger: "bg-danger text-accent-ink shadow-[var(--shadow)] hover:opacity-90",
  ghost: "text-ink hover:bg-surface-2",
  ai: "ai-button",
};

/** Shared classes for links that should look like buttons. */
export function buttonClass(variant: keyof typeof buttonStyles = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold sm:min-h-10",
    buttonStyles[variant],
    className,
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof buttonStyles;
    loading?: boolean;
  }
>(function Button(
  { variant = "primary", className, type = "button", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-10",
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        variant === "ai" ? (
          <Sparkles className="ai-sparkle-spin h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        )
      ) : null}
      {children}
    </button>
  );
});

export function choiceClass(on: boolean, className?: string) {
  return cn(
    "inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 text-sm",
    on ? "choice-selected" : "border border-line bg-surface font-medium text-ink hover:border-line-strong hover:bg-surface-2",
    className,
  );
}

const control =
  "w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink shadow-[var(--shadow-inset)] placeholder:text-muted/80 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, "h-11 sm:h-10", props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, "min-h-28 py-2.5 leading-6", props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, "h-11 sm:h-10", props.className)} />;
}

export function Field({
  label,
  hint,
  children,
  action,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const hintNode = hint ? <span className="text-[13px] leading-5 text-muted">{hint}</span> : null;
  if (action) {
    return (
      <div className="grid min-w-0 gap-1.5 text-sm">
        <span className="flex min-h-6 items-center justify-between gap-2">
          <span className="font-medium">{label}</span>
          {action}
        </span>
        {children}
        {hintNode}
      </div>
    );
  }
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hintNode}
    </label>
  );
}

export function CountSelect({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <SelectInput value={String(value)} onChange={(event) => onChange(Number(event.target.value))}>
        {tagCountOptions.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)] sm:p-6", className)}>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Shown while the AI is writing: a spinning sparkle, a gradient label, and shimmering lines. */
export function AiThinking({ label = "Thinking", lines = 3, className }: { label?: string; lines?: number; className?: string }) {
  const widths = ["92%", "78%", "86%", "64%", "72%"];
  return (
    <div className={cn("grid gap-3", className)} role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="ai-sparkle-spin h-4 w-4 text-[var(--ai-2)]" aria-hidden />
        <span className="ai-text">{label}…</span>
      </p>
      <div className="grid gap-2.5" aria-hidden>
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} className="ai-shimmer-line" style={{ width: widths[index % widths.length], animationDelay: `${index * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}
