import type { ReactNode } from "react";
import { FileArchive, FileText } from "lucide-react";
import type { MarketplaceListing } from "@/lib/types";

export function SkillPreview({
  listing,
  children,
  heading = "h1",
}: {
  listing: MarketplaceListing;
  children?: ReactNode;
  heading?: "h1" | "h2";
}) {
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;
  const Title = heading;
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="grid h-24 place-items-center bg-surface-2/80">
        <FileIcon className="h-7 w-7 text-muted" />
      </div>
      <div className="grid gap-4 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {listing.kind === "bundle" ? "Bundle" : "Skill"}
          </p>
          <Title className="mt-1 text-xl font-semibold tracking-tight">{listing.title}</Title>
          {listing.description ? (
            <p className="mt-2 text-sm leading-6 text-muted">{listing.description}</p>
          ) : null}
        </div>
        {listing.offerings.length ? (
          <ul className="grid gap-1 text-sm text-muted">
            {listing.offerings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {children}
      </div>
    </article>
  );
}
