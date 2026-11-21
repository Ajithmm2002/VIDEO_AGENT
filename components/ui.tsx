import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tagCountOptions } from "@/lib/types";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="ig-text mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  const styles = {
    primary: "ig-gradient text-white shadow-[var(--shadow-glow)] hover:brightness-105",
    secondary: "border border-line bg-surface text-ink shadow-[var(--shadow)] hover:bg-surface-2",
    danger: "bg-danger text-white shadow-[0_12px_24px_-14px_rgb(237_73_86_/_0.7)] hover:opacity-90",
    ghost: "text-ink hover:bg-surface-2",
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function choiceClass(on: boolean, className?: string) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm",
    on ? "choice-selected" : "border border-line bg-surface font-medium text-ink shadow-[var(--shadow)]",
    className,
  );
}

const control =
  "w-full rounded-2xl border border-line bg-surface px-3 text-sm text-ink shadow-[var(--shadow-inset)] placeholder:text-muted/70";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, "h-11", props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, "min-h-28 py-2.5", props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, "h-11", props.className)} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-muted">{hint}</span> : null}
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
    <section
      className={cn(
        "rounded-[1.75rem] border border-line bg-surface/90 p-5 shadow-[var(--shadow)] backdrop-blur-xl",
        className,
      )}
    >
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
    <div className="grid place-items-center rounded-[1.75rem] border border-dashed border-line bg-surface-2/70 px-6 py-10 text-center shadow-[var(--shadow-inset)]">
      <div className="ig-gradient mb-3 grid h-12 w-12 place-items-center rounded-2xl text-lg text-white shadow-[var(--shadow-glow)]">✦</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
