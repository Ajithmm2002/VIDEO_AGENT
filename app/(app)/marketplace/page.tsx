import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { listMarketplaceListings, listMyPurchases } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Skill shop" };

export default async function MarketplacePage() {
  const [listings, purchases, email] = await Promise.all([
    listMarketplaceListings(),
    listMyPurchases(),
    isSupabaseConfigured() ? requestUserEmail() : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Skill shop"
        description="Preview Claude and LLM skills, then take a free listing or wait for checkout on paid ones. Image samples and seller uploads are coming soon."
      />
      <MarketplaceBrowser listings={listings} purchases={purchases} isAdmin={isMarketplaceAdmin(email)} />
    </div>
  );
}
