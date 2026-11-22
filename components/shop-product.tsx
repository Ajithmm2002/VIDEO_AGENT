import Link from "next/link";
import { CopyField } from "@/components/copy-button";
import { MarketplaceBuy } from "@/components/marketplace-browser";
import { ProductArt } from "@/components/product-art";
import { ProductReviews } from "@/components/product-reviews";
import { StarRating } from "@/components/star-rating";
import { listingKindLabel } from "@/lib/marketplace-catalog";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { ratingLabel, type ReviewRatingSummary } from "@/lib/shop-reviews";
import type { MarketplaceListing, MarketplacePurchase, MarketplaceReview } from "@/lib/types";

export function ShopProduct({
  listing,
  purchase,
  coins,
  reviews,
  rating,
  currentUserId,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
  reviews: MarketplaceReview[];
  rating?: ReviewRatingSummary;
  currentUserId: string | null;
}) {
  const owned = purchase?.status === "paid";
  return (
    <div className="grid gap-10">
      <nav className="text-sm text-muted">
        <Link href="/marketplace" className="font-semibold text-accent">
          Marketplace
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface dark:rounded-md">
          <ProductArt listing={listing} className="min-h-64 sm:min-h-80" />
        </div>
        <div className="grid gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {listingKindLabel(listing.kind)}
              {owned ? " · Owned" : ""}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{listing.title}</h1>
            <div className="mt-3">
              <StarRating value={rating?.average ?? 0} count={rating?.count} />
              <p className="mt-1 text-sm text-muted">{ratingLabel(rating)}</p>
            </div>
            <p className="mt-4 text-3xl font-semibold">{formatSkillPrice(listing.price_paise)}</p>
          </div>
          <CopyField label="About this product" text={listing.description}>
            <p className="whitespace-pre-wrap text-base leading-7 text-muted">{listing.description}</p>
          </CopyField>
          {listing.offerings.length ? (
            <div>
              <h2 className="text-sm font-semibold">What’s included</h2>
              <ul className="mt-2 grid gap-1 text-sm leading-6 text-muted">
                {listing.offerings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <MarketplaceBuy listing={listing} purchase={purchase} coins={coins} />
        </div>
      </div>

      <ProductReviews listingId={listing.id} reviews={reviews} canReview={owned} currentUserId={currentUserId} />
    </div>
  );
}
