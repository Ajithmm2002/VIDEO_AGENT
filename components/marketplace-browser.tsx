"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RazorpayComingSoon } from "@/components/razorpay-coming-soon";
import { Button } from "@/components/ui";
import { redeemListingWithCoins } from "@/lib/actions/game";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import { formatSkillPrice } from "@/lib/marketplace-file";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

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
  const [working, setWorking] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [openingPlay, startPlay] = useTransition();
  const pending = working || refreshing;
  const free = listing.price_paise <= 0;
  const cost = priceInCoins(listing.price_paise);
  const canCoinBuy = !free && coins >= cost;
  const paid = purchase?.status === "paid";

  async function buyWithCoins() {
    setWorking(true);
    try {
      const result = await redeemListingWithCoins(listing.id);
      if (!result.ok) {
        toast.error(result.error);
        setWorking(false);
        return;
      }
      toast.success(result.message ?? "Saved to Purchases");
      startRefresh(() => {
        router.refresh();
        setWorking(false);
      });
    } catch {
      setWorking(false);
    }
  }

  const moneyPay = (
    <RazorpayComingSoon
      title={listing.title}
      amountPaise={listing.price_paise}
      disabled={pending}
      label={`Pay ${formatSkillPrice(listing.price_paise)}`}
      note="Razorpay checkout is coming soon. This pays the listed rupee price with card, UPI, or net banking. You can also pay with studio coins if you have enough."
    />
  );

  if (paid) {
    return (
      <div className="grid gap-3 border-t border-line pt-4">
        <p className="text-sm leading-6 text-muted">You already own this. Downloads are in Purchases.</p>
        <Link
          href="/purchases"
          className="ig-gradient inline-flex h-11 items-center justify-center rounded-2xl px-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
        >
          Open Purchases
        </Link>
      </div>
    );
  }

  if (free) {
    return (
      <div className="grid gap-3 border-t border-line pt-4">
        <p className="text-2xl font-semibold">Free</p>
        <Button loading={pending} onClick={buyWithCoins} className="w-full">
          {pending ? "Unlocking…" : "Get this product"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Buy this product</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2 rounded-2xl border border-line bg-surface-2/70 p-3 shadow-[var(--shadow-inset)] dark:rounded-md">
          <p className="text-sm font-semibold">Pay with coins</p>
          <p className="text-xs text-muted">🪙 {formatCoins(cost)}</p>
          <p className="text-xs text-muted">You have 🪙 {formatCoins(coins)}</p>
          {canCoinBuy ? (
            <Button loading={pending} disabled={pending} onClick={buyWithCoins} className="w-full">
              {pending ? "Buying…" : "Pay with coins"}
            </Button>
          ) : (
            <>
              <Button className="w-full" disabled>
                Pay with coins
              </Button>
              <p className="text-xs leading-5 text-muted">Need {formatCoins(Math.max(1, cost - coins))} more</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="secondary"
                  loading={openingPlay}
                  className="min-h-11 px-2 text-xs"
                  onClick={() => {
                    startPlay(() => {
                      router.push("/play");
                    });
                  }}
                >
                  Earn coins
                </Button>
                <Button
                  variant="secondary"
                  loading={openingPlay}
                  className="min-h-11 px-2 text-xs"
                  onClick={() => {
                    startPlay(() => {
                      router.push("/play#coin-packs");
                    });
                  }}
                >
                  Buy pack
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="grid gap-2 rounded-2xl border border-line bg-surface-2/70 p-3 shadow-[var(--shadow-inset)] dark:rounded-md">
          <p className="text-sm font-semibold">Pay with money</p>
          <p className="text-xs text-muted">{formatSkillPrice(listing.price_paise)}</p>
          <p className="text-xs text-muted">Card, UPI, or net banking</p>
          {moneyPay}
        </div>
      </div>
    </div>
  );
}
