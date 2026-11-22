import { FileArchive, FileText } from "lucide-react";
import { listingKindLabel } from "@/lib/marketplace-catalog";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/lib/types";

export function ProductArt({
  listing,
  className,
  compact = false,
}: {
  listing: MarketplaceListing;
  className?: string;
  compact?: boolean;
}) {
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;
  return (
    <div
      className={cn(
        "grid place-items-center bg-surface-2 text-muted",
        compact ? "aspect-[4/3]" : "aspect-square",
        className,
      )}
      aria-hidden
    >
      <span className={cn("grid place-items-center", compact ? "gap-1" : "gap-2")}>
        <span
          className={cn(
            "ig-gradient grid place-items-center rounded-md text-accent-ink",
            compact ? "h-9 w-9" : "h-14 w-14",
          )}
        >
          <FileIcon className={compact ? "h-4 w-4" : "h-6 w-6"} />
        </span>
        {compact ? null : (
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{listingKindLabel(listing.kind)}</span>
        )}
      </span>
    </div>
  );
}
