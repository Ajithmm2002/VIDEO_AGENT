import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, href = "/dashboard" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3", compact ? "px-0" : "px-2")}>
      <span className="ig-gradient grid h-10 w-10 place-items-center rounded-md text-sm font-bold text-white">
        CS
      </span>
      {compact ? null : (
        <span className="hidden min-[420px]:block">
          <span className="block text-sm font-semibold tracking-tight">Content Studio</span>
          <span className="block text-xs text-muted">YouTube · Instagram</span>
        </span>
      )}
    </Link>
  );
}
