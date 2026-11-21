import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameCoins, listMarketplaceListings, listMyPurchases } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Skill shop" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
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
        description="Browse every listed skill and digital product. Details and purchase stay on this page. Earn coins in Fun mode, buy coin packs, redeem coins, or pay rupees. Coins stay in this shop and cannot be cashed out."
      />
      <MarketplaceBrowser
        listings={listings}
        purchases={purchases}
        isAdmin={isMarketplaceAdmin(email)}
        coins={coins}
        selectedId={first(params.item) ?? null}
      />
    </div>
  );
}
