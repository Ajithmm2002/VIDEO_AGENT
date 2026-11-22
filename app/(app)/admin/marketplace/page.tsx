import type { Metadata } from "next";
import { requireShopAdmin } from "@/app/(app)/admin/marketplace/guard";
import { MarketplaceProductManager } from "@/components/marketplace-admin";
import { PageHeader } from "@/components/ui";
import { listMarketplaceListings, listPendingMoneyPurchases } from "@/lib/queries";

export const metadata: Metadata = { title: "Manage products" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketplaceAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireShopAdmin();
  const params = await searchParams;
  const editId = first(params.edit)?.trim() || null;
  const [listings, pending] = await Promise.all([
    listMarketplaceListings({ includeDrafts: true }),
    listPendingMoneyPurchases(),
  ]);
  const editing = editId ? listings.find((item) => item.id === editId) : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={editing ? `Edit ${editing.title}` : "Manage products"}
        description={
          editing
            ? "You are updating this product on Manage products. This does not list a new item. Cancel to return to the list."
            : "See listed and draft products here. Listing a new product is a separate page. Set the rupee price only. Coin cost is an in-app shop price (100 coins per ₹1 on the tag)."
        }
      />
      <MarketplaceProductManager listings={listings} pending={pending} editId={editId} />
    </div>
  );
}
