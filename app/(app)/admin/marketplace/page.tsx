import type { Metadata } from "next";
import { requireShopAdmin } from "@/app/(app)/admin/marketplace/guard";
import { MarketplaceProductManager } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";
import { listMarketplaceListings, listPendingMoneyPurchases } from "@/lib/queries";

export const metadata: Metadata = { title: "Manage products" };

export default async function MarketplaceAdminPage() {
  await requireShopAdmin();
  const [listings, pending] = await Promise.all([
    listMarketplaceListings({ includeDrafts: true }),
    listPendingMoneyPurchases(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Manage products"
        description="See listed and draft products here. Listing a new product is a separate page. Set the rupee price only. Coin cost is an in-app shop price (100 coins per ₹1 on the tag)."
      />
      <MarketplaceProductManager listings={listings} pending={pending} />
    </div>
  );
}
