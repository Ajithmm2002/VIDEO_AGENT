import type { Metadata } from "next";
import { requireShopAdmin } from "@/app/(app)/admin/marketplace/guard";
import { MarketplaceListingForm } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "List a product" };

export default async function NewMarketplaceListingPage() {
  await requireShopAdmin();

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="List a product"
        description="Create a new shop listing. Current products stay on Manage products."
      />
      <MarketplaceListingForm />
    </div>
  );
}
