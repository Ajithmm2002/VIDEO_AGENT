import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileArchive, FileText } from "lucide-react";
import { MarketplaceBuy } from "@/components/marketplace-browser";
import { getGameCoins, getMarketplaceListing, listMyPurchases } from "@/lib/queries";

export const metadata: Metadata = { title: "Skill" };

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getMarketplaceListing(id);
  if (!listing || !listing.listed) notFound();
  const [purchases, coins] = await Promise.all([listMyPurchases(), getGameCoins()]);
  const purchase = purchases.find((item) => item.listing_id === listing.id);
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/marketplace" className="text-sm font-semibold text-muted hover:text-ink">
        ← Shop
      </Link>
      <article className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="grid h-24 place-items-center bg-surface-2/80">
          <FileIcon className="h-7 w-7 text-muted" />
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {listing.kind === "bundle" ? "Bundle" : "Skill"}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{listing.title}</h1>
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
          <MarketplaceBuy listing={listing} purchase={purchase} coins={coins} />
        </div>
      </article>
    </div>
  );
}
