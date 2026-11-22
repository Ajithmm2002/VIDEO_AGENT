"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileArchive, FileText, Search } from "lucide-react";
import { downloadListingFile } from "@/components/download-listing";
import { Button, Card, EmptyState } from "@/components/ui";
import { listingKindLabel, type PurchaseRecord } from "@/lib/marketplace-catalog";
import { formatSkillPrice } from "@/lib/marketplace-file";

export function MyPurchases({ records }: { records: PurchaseRecord[] }) {
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((item) => {
      const hay = [item.listing?.title, item.listing?.description, item.listing?.kind].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [query, records]);
  const paid = visible.filter((item) => item.purchase.status === "paid");
  const pending = visible.filter((item) => item.purchase.status !== "paid");

  async function download(listingId: string) {
    setDownloadingId(listingId);
    try {
      await downloadListingFile(listingId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download.");
    } finally {
      window.setTimeout(() => setDownloadingId(null), 1600);
    }
  }

  if (!records.length) {
    return (
      <Card>
        <EmptyState
          title="No purchases yet"
          body="Buy a skill or digital product in the marketplace. Owned files will show up here."
        />
        <div className="mt-4">
          <Link
            href="/marketplace"
            className="ig-gradient inline-flex rounded-2xl px-3.5 py-2 text-sm font-semibold text-accent-ink shadow-[var(--shadow-glow)]"
          >
            Open marketplace
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {paid.length} owned · {pending.length} waiting
        </p>
        <Link
          href="/marketplace"
          className="inline-flex rounded-2xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow)]"
        >
          Buy more
        </Link>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search purchases"
          aria-label="Search purchases"
          className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-3 text-sm shadow-[var(--shadow-inset)]"
        />
      </label>
      {visible.length ? (
        <div className="grid gap-3">
          {visible.map((item) => (
            <PurchaseCard
              key={`${item.purchase.listing_id}-${item.purchase.created_at}`}
              record={item}
              downloading={downloadingId === item.purchase.listing_id}
              onDownload={() => download(item.purchase.listing_id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No matching purchases" body="Try another search, or clear it to see everything you bought." />
        </Card>
      )}
    </div>
  );
}

function PurchaseCard({
  record,
  downloading,
  onDownload,
}: {
  record: PurchaseRecord;
  downloading: boolean;
  onDownload: () => void;
}) {
  const { purchase, listing } = record;
  const FileIcon = listing?.file_ext === "zip" ? FileArchive : FileText;
  const paid = purchase.status === "paid";

  return (
    <Card className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface-2 text-muted shadow-[var(--shadow-inset)]">
        <FileIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {listing ? listingKindLabel(listing.kind) : "Product"} · {paid ? "Owned" : "Waiting"}
        </p>
        <h2 className="mt-0.5 truncate font-semibold">{listing?.title ?? "This product is no longer listed"}</h2>
        <p className="mt-0.5 text-sm text-muted">{formatSkillPrice(purchase.amount_paise)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {listing ? (
          <Link
            href={`/marketplace?item=${listing.id}`}
            className="inline-flex items-center rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]"
          >
            View listing
          </Link>
        ) : null}
        {paid ? (
          <Button loading={downloading} onClick={onDownload}>
            {downloading ? "Downloading…" : "Download"}
          </Button>
        ) : (
          <p className="text-sm text-muted">Payment is not confirmed yet.</p>
        )}
      </div>
    </Card>
  );
}
