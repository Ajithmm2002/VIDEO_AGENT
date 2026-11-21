"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ComingSoonNotice } from "@/components/coming-soon";
import { Button, Card, EmptyState } from "@/components/ui";
import { requestMarketplaceSkill } from "@/lib/actions/marketplace";
import { formatSkillPrice } from "@/lib/marketplace-file";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export function MarketplaceBrowser({
  listings,
  purchases,
  isAdmin,
}: {
  listings: MarketplaceListing[];
  purchases: MarketplacePurchase[];
  isAdmin: boolean;
}) {
  const byListing = new Map(purchases.map((item) => [item.listing_id, item]));

  return (
    <div className="grid gap-4">
      <ComingSoonNotice
        title="Payments, seller uploads, and image samples are on the way"
        body="For now the shop owner lists Claude and LLM skills as .md files or .zip bundles. You can preview the description and offerings. Paid checkout is coming soon. Free skills can be taken today."
      />
      {isAdmin ? (
        <Link
          href="/admin/marketplace"
          className="ig-gradient inline-flex w-fit rounded-2xl px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
        >
          Open admin desk
        </Link>
      ) : null}
      {listings.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <MarketplaceBuy key={listing.id} listing={listing} purchase={byListing.get(listing.id)} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No skills on the shelf yet"
            body="When the shop owner lists a skill, it will show up here with a description, offerings, and a price."
          />
        </Card>
      )}
    </div>
  );
}

export function MarketplaceBuy({
  listing,
  purchase,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const free = listing.price_paise <= 0;

  return (
    <Card className="grid gap-4">
      <div className="grid h-36 place-items-center rounded-[1.5rem] border border-dashed border-line bg-surface-2/80 shadow-[var(--shadow-inset)]">
        <p className="text-center text-sm text-muted">
          Image samples
          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-accent">Coming soon</span>
        </p>
      </div>
      <div>
        <p className="ig-text text-[11px] font-semibold uppercase tracking-[0.18em]">
          {listing.kind === "bundle" ? "Bundle" : "Skill"} · {listing.file_ext === "zip" ? "ZIP" : "Markdown"}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          <Link href={`/marketplace/${listing.id}`} className="hover:text-accent">{listing.title}</Link>
        </h2>
        <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">{listing.description}</p>
      </div>
      {listing.offerings.length ? (
        <ul className="grid gap-1 text-sm">
          {listing.offerings.slice(0, 4).map((item) => (
            <li key={item} className="text-muted">• {item}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">{formatSkillPrice(listing.price_paise)}</p>
        {purchase?.status === "paid" ? (
          <a href={`/api/marketplace/download?id=${listing.id}`} className="ig-gradient inline-flex rounded-2xl px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]">
            Download
          </a>
        ) : purchase?.status === "checkout_soon" ? (
          <span className="rounded-full bg-accent/12 px-3 py-1.5 text-xs font-semibold text-accent">Checkout coming soon</span>
        ) : (
          <Button
            loading={pending}
            onClick={async () => {
              setPending(true);
              try {
                const result = await requestMarketplaceSkill(listing.id);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(result.message ?? "Saved");
                router.refresh();
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Working…" : free ? "Get this skill" : "Buy"}
          </Button>
        )}
      </div>
    </Card>
  );
}
