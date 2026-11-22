import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireShopAdmin } from "@/app/(app)/admin/marketplace/guard";
import { MarketplaceListingForm } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";
import { getMarketplaceListing } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditMarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireShopAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const listing = await getMarketplaceListing(id);
  if (!listing) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Edit product"
        description="Update this listing, then return to Manage products."
      />
      <MarketplaceListingForm listing={listing} />
    </div>
  );
}
