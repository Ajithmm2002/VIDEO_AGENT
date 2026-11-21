import { notFound, redirect } from "next/navigation";
import { getMarketplaceListing } from "@/lib/queries";

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getMarketplaceListing(id);
  if (!listing || !listing.listed) notFound();
  redirect(`/marketplace?item=${encodeURIComponent(listing.id)}`);
}
