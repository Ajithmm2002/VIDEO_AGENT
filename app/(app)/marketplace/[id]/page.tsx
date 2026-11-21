import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoinRewardNotice } from "@/components/coin-reward-notice";
import { MarketplaceBuy } from "@/components/marketplace-browser";
import { SkillPreview } from "@/components/skill-preview";
import { getGameCoins, getMarketplaceListing, listMyPurchases } from "@/lib/queries";

export const metadata: Metadata = { title: "Skill" };

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, purchases, coins] = await Promise.all([
    getMarketplaceListing(id),
    listMyPurchases(),
    getGameCoins(),
  ]);
  if (!listing || !listing.listed) notFound();
  const purchase = purchases.find((item) => item.listing_id === listing.id);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/marketplace" className="text-sm font-semibold text-muted hover:text-ink">
        ← Shop
      </Link>
      <div className="mt-5 grid gap-3">
        <SkillPreview listing={listing}>
          <MarketplaceBuy listing={listing} purchase={purchase} coins={coins} />
        </SkillPreview>
        <CoinRewardNotice compact />
      </div>
    </div>
  );
}
