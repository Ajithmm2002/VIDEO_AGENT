import type { MarketplaceKind, MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export const marketplaceCatalogFilters = ["all", "skill", "bundle", "owned"] as const;
export type MarketplaceCatalogFilter = (typeof marketplaceCatalogFilters)[number];

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
