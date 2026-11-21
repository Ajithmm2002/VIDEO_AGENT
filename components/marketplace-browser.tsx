"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FileArchive, FileText } from "lucide-react";
import { ComingSoonNotice } from "@/components/coming-soon";
import { RazorpayComingSoon } from "@/components/razorpay-coming-soon";
import { Button, Card, EmptyState } from "@/components/ui";
import { redeemListingWithCoins } from "@/lib/actions/game";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">🪙 {formatCoins(coins)} · 100 coins = ₹1</p>
        {isAdmin ? (
          <Link
            href="/admin/marketplace"
            className="ig-gradient inline-flex rounded-2xl px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-glow)]"
          >
            Admin desk
          </Link>
        ) : null}
      </div>
      <ComingSoonNotice
        title="Razorpay checkout is next"
        body="Coin cost is calculated from the rupee price (100 coins = ₹1). Buy with coins, or tap Buy now for Razorpay coming soon."
      />
      {listings.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.map((listing) => (
            <MarketplaceBuy
              key={listing.id}
              listing={listing}
              purchase={byListing.get(listing.id)}
              coins={coins}
              compact
            />
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
  compact = false,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const free = listing.price_paise <= 0;
  const cost = priceInCoins(listing.price_paise);
  const canCoinBuy = !free && coins >= cost;
  const paid = purchase?.status === "paid";
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;

  async function buyWithCoins() {
    setPending(true);
    try {
      const result = await redeemListingWithCoins(listing.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const actions = paid ? (
    <a
      href={`/api/marketplace/download?id=${listing.id}`}
      className={cn(
        "ig-gradient inline-flex w-full items-center justify-center rounded-xl text-xs font-semibold text-white shadow-[var(--shadow-glow)]",
        compact ? "h-8 px-2" : "h-10 rounded-2xl px-3.5 text-sm",
      )}
    >
      Download
    </a>
  ) : free ? (
    <Button loading={pending} onClick={buyWithCoins} className={compact ? "h-8 w-full px-2 py-1 text-xs" : "w-full"}>
      {pending ? "Working…" : "Get this skill"}
    </Button>
  ) : (
    <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
      {canCoinBuy ? (
        <Button
          variant="secondary"
          loading={pending}
          disabled={pending}
          onClick={buyWithCoins}
          className={compact ? "h-8 w-full px-2 py-1 text-xs" : "w-full"}
        >
          {pending ? "Working…" : compact ? "Coins" : "Pay with coins"}
        </Button>
      ) : (
        <Link
          href="/play"
          className={cn(
            "inline-flex items-center justify-center border border-line bg-surface font-semibold shadow-[var(--shadow)]",
            compact ? "h-8 rounded-xl px-2 text-xs" : "h-10 rounded-2xl px-3.5 text-sm",
          )}
        >
          Earn coins
        </Link>
      )}
      <RazorpayComingSoon title={listing.title} amountPaise={listing.price_paise} compact={compact} />
    </div>
  );

  if (compact) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-[var(--shadow)]">
        <Link href={`/marketplace/${listing.id}`} className="grid h-28 place-items-center bg-surface-2/80">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface text-muted shadow-[var(--shadow-inset)]">
            <FileIcon className="h-5 w-5" />
          </span>
        </Link>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {listing.kind === "bundle" ? "Bundle" : "Skill"}
          </p>
          <Link href={`/marketplace/${listing.id}`} className="line-clamp-2 text-sm font-semibold leading-5 hover:text-accent">
            {listing.title}
          </Link>
          <p className="line-clamp-2 text-xs leading-4 text-muted">{listing.description}</p>
          <div className="mt-auto pt-1">
            <p className="text-base font-semibold">{formatSkillPrice(listing.price_paise)}</p>
            {free ? null : <p className="text-[11px] text-muted">🪙 {formatCoins(cost)}</p>}
            <div className="mt-2">{actions}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <div>
        <p className="text-2xl font-semibold">{formatSkillPrice(listing.price_paise)}</p>
        {free ? null : <p className="mt-0.5 text-sm text-muted">🪙 {formatCoins(cost)}</p>}
      </div>
      {actions}
    </div>
  );
}
