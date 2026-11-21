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
        description="Earn coins in Fun mode, buy coin packs with money, redeem coins for skills, or buy those same skills with rupees. Coins stay in this shop and cannot be cashed out."
      />
      <MarketplaceBrowser listings={listings} purchases={purchases} isAdmin={isMarketplaceAdmin(email)} coins={coins} />
    </div>
  );
}
