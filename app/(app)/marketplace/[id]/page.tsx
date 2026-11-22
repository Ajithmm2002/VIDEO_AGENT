import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopProduct } from "@/components/shop-product";
import { getGameCoins, getMarketplaceListing, listMarketplaceReviews, listMyPurchases } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { summarizeReviews } from "@/lib/shop-reviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getMarketplaceListing(id);
  if (!listing || !listing.listed) return { title: "Product" };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
  };
}

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, purchases, coins, reviews, user] = await Promise.all([
    getMarketplaceListing(id),
    listMyPurchases(),
    getGameCoins(),
    listMarketplaceReviews(id),
    getCurrentUser(),
  ]);
  if (!listing || !listing.listed) notFound();
  const purchase = purchases.find((item) => item.listing_id === listing.id);
  const rating = summarizeReviews(reviews)[0];

  return (
    <ShopProduct
      listing={listing}
      purchase={purchase}
      coins={coins}
      reviews={reviews}
      rating={rating}
      currentUserId={user?.id ?? null}
    />
  );
}
