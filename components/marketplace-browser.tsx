"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ComingSoonNotice } from "@/components/coming-soon";
import { Button, Card, EmptyState } from "@/components/ui";
import { redeemListingWithCoins } from "@/lib/actions/game";
import { requestMarketplaceSkill } from "@/lib/actions/marketplace";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import { formatSkillPriceWithCoins } from "@/lib/marketplace-file";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export function MarketplaceBrowser({
  listings,
  purchases,
  isAdmin,
  coins,
}: {
  listings: MarketplaceListing[];
  purchases: MarketplacePurchase[];
  isAdmin: boolean;
  coins: number;
}) {
  const byListing = new Map(purchases.map((item) => [item.listing_id, item]));

  return (
    <div className="grid gap-4">
      <ComingSoonNotice
        title="Card checkout, seller uploads, and image samples are on the way"
        body="You can buy listed skills with Fun mode coins today (1 coin = ₹1). Free skills can be taken without coins. Play longer runs to earn more, then claim them."
      />
      <p className="text-sm font-semibold">Your wallet: {formatCoins(coins)}</p>
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
            <MarketplaceBuy key={listing.id} listing={listing} purchase={byListing.get(listing.id)} coins={coins} />
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
  coins,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const free = listing.price_paise <= 0;
  const cost = priceInCoins(listing.price_paise);
  const canCoinBuy = !free && coins >= cost;

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
        <p className="text-lg font-semibold">{formatSkillPriceWithCoins(listing.price_paise)}</p>
        {purchase?.status === "paid" ? (
          <a href={`/api/marketplace/download?id=${listing.id}`} className="ig-gradient inline-flex rounded-2xl px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]">
            Download
          </a>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!free && !canCoinBuy ? (
              <Link href="/play" className="inline-flex items-center rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]">
                Earn {Math.max(1, cost - coins)} more coins
              </Link>
            ) : null}
            {purchase?.status === "checkout_soon" && !canCoinBuy ? (
              <span className="rounded-full bg-accent/12 px-3 py-1.5 text-xs font-semibold text-accent">Card checkout coming soon</span>
            ) : (
              <Button
                loading={pending}
                onClick={async () => {
                  setPending(true);
                  try {
                    const result = canCoinBuy
                      ? await redeemListingWithCoins(listing.id)
                      : await requestMarketplaceSkill(listing.id);
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
                {pending ? "Working…" : free ? "Get this skill" : canCoinBuy ? `Buy with ${cost} coins` : "Wait for checkout"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
