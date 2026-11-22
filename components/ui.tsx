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
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="ig-text mb-3 text-xs font-semibold uppercase tracking-[0.18em]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    loading?: boolean;
  }
>(function Button(
  { variant = "primary", className, type = "button", loading = false, disabled, children, ...props },
  ref,
) {
  const styles = {
    primary: "ig-gradient text-accent-ink shadow-[var(--shadow-glow)] hover:brightness-105",
    secondary: "border border-line bg-surface text-ink shadow-[var(--shadow)] hover:bg-surface-2 dark:shadow-none",
    danger: "bg-danger text-accent-ink shadow-[var(--shadow-glow)] hover:opacity-90",
    ghost: "text-ink hover:bg-surface-2",
  };
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:rounded-md",
        styles[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function choiceClass(on: boolean, className?: string) {
  return cn(
    "inline-flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm",
    on ? "choice-selected" : "border border-line bg-surface font-medium text-ink shadow-[var(--shadow)]",
    className,
  );
}

const control =
  "w-full min-w-0 rounded-2xl border border-line bg-surface px-3 text-base text-ink shadow-[var(--shadow-inset)] placeholder:text-muted dark:rounded-md dark:shadow-none";

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
  action,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const heading = (
    <span className="flex items-center justify-between gap-2">
      <span className="font-medium">{label}</span>
      {action}
    </span>
  );
  const hintNode = hint ? <span className="text-sm leading-6 text-muted">{hint}</span> : null;
  if (action) {
    return (
      <div className="grid min-w-0 gap-1.5 text-sm">
        {heading}
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
    <section
      className={cn(
        "rounded-[1.75rem] border border-line bg-surface/90 p-6 shadow-[var(--shadow)] backdrop-blur-xl dark:rounded-md dark:bg-surface dark:shadow-none dark:backdrop-blur-none",
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
    <div className="grid place-items-center rounded-[1.75rem] border border-dashed border-line bg-surface-2/70 px-6 py-10 text-center shadow-[var(--shadow-inset)] dark:rounded-md dark:bg-surface-2 dark:shadow-none">
      <div className="ig-gradient mb-4 grid h-12 w-12 place-items-center rounded-2xl text-accent-ink shadow-[var(--shadow-glow)] dark:rounded-md dark:shadow-none">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 max-w-md text-base leading-7 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
