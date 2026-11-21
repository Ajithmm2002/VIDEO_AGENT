import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketplaceAdmin } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";
import { isMarketplaceAdmin, isSupabaseConfigured } from "@/lib/env";
import { listMarketplaceListings } from "@/lib/queries";
import { getCurrentUser, requestUserEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Shop admin" };

export default async function MarketplaceAdminPage() {
  if (!isSupabaseConfigured()) redirect("/marketplace");
  const [email, user] = await Promise.all([requestUserEmail(), getCurrentUser()]);
  if (!isMarketplaceAdmin(email ?? user?.email)) redirect("/marketplace");
  const listings = await listMarketplaceListings({ includeDrafts: true });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Skill shop desk"
        description="Upload a .md skill or a .zip bundle, set the price, and choose what buyers get. Checkout and image samples are coming soon."
      />
      <MarketplaceAdmin listings={listings} adminEmail={(email ?? user?.email ?? "").slice(0, 320)} />
    </div>
  );
}
