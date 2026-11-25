import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, href = "/dashboard" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label="Content Studio home" className={cn("flex items-center gap-2.5", compact ? "px-0" : "px-1")}>
      <span
        className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-[13px] font-bold tracking-tight text-accent-ink shadow-[var(--shadow-glow)]"
        aria-hidden
      >
        CS
      </span>
      {compact ? null : (
        <span className="hidden leading-tight min-[420px]:block">
          <span className="block text-[15px] font-semibold tracking-tight">Content Studio</span>
          <span className="block text-xs text-muted">YouTube · Instagram</span>
        </span>
      )}
    </Link>
  );
}
