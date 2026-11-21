import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketplaceAdmin } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { listMarketplaceListings, listPendingMoneyPurchases } from "@/lib/queries";
import { getCurrentUser, requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Shop admin" };

export default async function MarketplaceAdminPage() {
  if (!isSupabaseConfigured()) redirect("/marketplace");
  const [email, user] = await Promise.all([requestUserEmail(), getCurrentUser()]);
  if (!isMarketplaceAdmin(email ?? user?.email)) redirect("/marketplace");
  const [listings, pending] = await Promise.all([
    listMarketplaceListings({ includeDrafts: true }),
    listPendingMoneyPurchases(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Skill shop desk"
        description="List skills and other digital products. Set the rupee price only. Coin cost is an in-app shop price (100 coins per ₹1 on the tag). Coins cannot be cashed out."
      />
      <MarketplaceAdmin listings={listings} pending={pending} />
    </div>
  );
}
