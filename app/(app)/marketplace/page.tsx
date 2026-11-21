import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameCoins, listMarketplaceListings, listMyPurchases } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Skill shop" };

export default async function MarketplacePage() {
  const [listings, purchases, email, coins] = await Promise.all([
    listMarketplaceListings(),
    listMyPurchases(),
    isSupabaseConfigured() ? requestUserEmail() : Promise.resolve(null),
    getGameCoins(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Skill shop"
        description="Preview Claude and LLM skills. Redeem studio coins in this shop, or tap Buy now to pay with money when Razorpay is ready. Coins are not cash and cannot be transferred."
      />
      <MarketplaceBrowser listings={listings} purchases={purchases} isAdmin={isMarketplaceAdmin(email)} coins={coins} />
    </div>
  );
}
