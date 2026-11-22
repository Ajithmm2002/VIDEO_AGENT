import type { ReviewRatingSummary } from "@/lib/shop-reviews";
import type { MarketplaceKind, MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export const marketplaceCatalogFilters = ["all", "skill", "bundle", "owned"] as const;
export type MarketplaceCatalogFilter = (typeof marketplaceCatalogFilters)[number];

export const marketplaceCatalogSorts = ["newest", "price_asc", "price_desc", "rating"] as const;
export type MarketplaceCatalogSort = (typeof marketplaceCatalogSorts)[number];

export function listingKindLabel(kind: MarketplaceKind) {
  return kind === "bundle" ? "Digital product" : "Skill";
}

export function normalizeShopQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80).toLowerCase();
}

export function listingSearchText(listing: MarketplaceListing) {
  return [listing.title, listing.description, listingKindLabel(listing.kind), listing.file_ext ?? "", ...listing.offerings]
    .join(" ")
    .toLowerCase();
}

export function filterMarketplaceCatalog(
  listings: MarketplaceListing[],
  options: {
    query?: string;
    filter?: MarketplaceCatalogFilter;
    purchasedIds?: Iterable<string>;
  } = {},
) {
  const query = normalizeShopQuery(options.query ?? "");
  const filter = options.filter ?? "all";
  const purchased = options.purchasedIds instanceof Set ? options.purchasedIds : new Set(options.purchasedIds ?? []);

  return listings.filter((listing) => {
    if (filter === "skill" && listing.kind !== "skill") return false;
    if (filter === "bundle" && listing.kind !== "bundle") return false;
    if (filter === "owned" && !purchased.has(listing.id)) return false;
    if (!query) return true;
    const haystack = listingSearchText(listing);
    return query.split(" ").filter(Boolean).every((token) => haystack.includes(token));
  });
}

export function sortMarketplaceCatalog(
  listings: MarketplaceListing[],
  sort: MarketplaceCatalogSort = "newest",
  ratings: Iterable<ReviewRatingSummary> = [],
) {
  const byId = new Map(Array.from(ratings, (item) => [item.listing_id, item]));
  return [...listings].sort((left, right) => {
    if (sort === "price_asc") return left.price_paise - right.price_paise;
    if (sort === "price_desc") return right.price_paise - left.price_paise;
    if (sort === "rating") {
      const leftRating = byId.get(left.id);
      const rightRating = byId.get(right.id);
      const leftAverage = leftRating?.average ?? 0;
      const rightAverage = rightRating?.average ?? 0;
      if (rightAverage !== leftAverage) return rightAverage - leftAverage;
      const leftCount = leftRating?.count ?? 0;
      const rightCount = rightRating?.count ?? 0;
      if (rightCount !== leftCount) return rightCount - leftCount;
    }
    return right.created_at.localeCompare(left.created_at);
  });
}

export function pickMarketplaceListing(listings: MarketplaceListing[], selectedId?: string | null) {
  if (selectedId) {
    const match = listings.find((listing) => listing.id === selectedId);
    if (match) return match;
  }
  return listings[0] ?? null;
}

export type PurchaseRecord = {
  purchase: MarketplacePurchase;
  listing: MarketplaceListing | null;
};

export function attachListingsToPurchases(purchases: MarketplacePurchase[], listings: MarketplaceListing[]): PurchaseRecord[] {
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  return purchases.map((purchase) => ({
    purchase,
    listing: byId.get(purchase.listing_id) ?? null,
  }));
}
