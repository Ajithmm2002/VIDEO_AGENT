import { FileArchive, FileText } from "lucide-react";
import { listingKindLabel } from "@/lib/marketplace-catalog";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/lib/types";

export function ProductArt({
  listing,
  className,
}: {
  listing: MarketplaceListing;
  className?: string;
}) {
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;
  return (
    <div
      className={cn(
        "grid aspect-square place-items-center bg-surface-2 text-muted",
        className,
      )}
      aria-hidden
    >
      <span className="grid gap-2 place-items-center">
        <span className="ig-gradient grid h-14 w-14 place-items-center rounded-md text-white">
          <FileIcon className="h-6 w-6" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{listingKindLabel(listing.kind)}</span>
      </span>
    </div>
  );
}
