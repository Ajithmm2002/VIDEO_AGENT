"use client";

import { RazorpayComingSoon } from "@/components/razorpay-coming-soon";
import { coinPacks, packCoinsLabel, packPriceLabel } from "@/lib/coin-packs";

export function CoinPacks() {
  return (
    <section id="coin-packs" className="grid gap-3">
      <div>
        <h2 className="font-semibold">Coin packs</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Buy studio coins with rupees. Packs credit your in-app balance only. They are not transferable and cannot be cashed out.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {coinPacks.map((pack) => (
          <article
            key={pack.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/90 p-3 shadow-[var(--shadow)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{pack.label}</p>
            <p className="mt-1 text-lg font-semibold leading-6">🪙 {packCoinsLabel(pack)}</p>
            <p className="mt-0.5 text-sm text-muted">{packPriceLabel(pack)}</p>
            <div className="mt-3">
              <RazorpayComingSoon
                title={`${pack.label} pack · ${packCoinsLabel(pack)}`}
                amountPaise={pack.pricePaise}
                compact
                note="After Razorpay is ready, this pack will add studio coins to your in-app balance. Coins stay in this shop, are not transferable, and cannot be converted into cash or gift cards."
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
