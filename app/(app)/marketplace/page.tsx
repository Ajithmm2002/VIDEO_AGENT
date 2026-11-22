import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShopCatalog } from "@/components/shop-catalog";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { getGameCoins, listMarketplaceListings, listMarketplaceReviewRatings, listMyPurchases } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Marketplace" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selected = first(params.item)?.trim();
  if (selected && /^[0-9a-f-]{36}$/i.test(selected)) redirect(`/marketplace/${selected}`);

  const [listings, purchases, email, coins, ratings] = await Promise.all([
    listMarketplaceListings(),
    listMyPurchases(),
    isSupabaseConfigured() ? requestUserEmail() : Promise.resolve(null),
    getGameCoins(),
    listMarketplaceReviewRatings(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Shop"
        title="Marketplace"
        description="Browse products like a store: compare price, ratings, and short reviews, then buy. Downloads stay in Purchases."
      />
      <ShopCatalog
        listings={listings}
        purchases={purchases}
        isAdmin={isMarketplaceAdmin(email)}
        coins={coins}
        ratings={ratings}
      />
    </div>
  );
}
