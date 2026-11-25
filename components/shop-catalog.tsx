"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { StarRating } from "@/components/star-rating";
import { Card, EmptyState, choiceClass } from "@/components/ui";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import {
  filterMarketplaceCatalog,
  listingKindLabel,
  sortMarketplaceCatalog,
  type MarketplaceCatalogFilter,
  type MarketplaceCatalogSort,
} from "@/lib/marketplace-catalog";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { ratingMap, type ReviewRatingSummary } from "@/lib/shop-reviews";
import { cn } from "@/lib/utils";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

const catalogFilters: { id: MarketplaceCatalogFilter; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "skill", label: "Skills" },
  { id: "bundle", label: "Digital products" },
];

const catalogSorts: { id: MarketplaceCatalogSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "rating", label: "Top rated" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

export function ShopCatalog({
  listings,
  purchases,
  isAdmin,
  coins,
  ratings,
}: {
  listings: MarketplaceListing[];
  purchases: MarketplacePurchase[];
  isAdmin: boolean;
  coins: number;
  ratings: ReviewRatingSummary[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MarketplaceCatalogFilter>("all");
  const [sort, setSort] = useState<MarketplaceCatalogSort>("newest");
  const purchasedIds = useMemo(
    () => new Set(purchases.filter((item) => item.status === "paid").map((item) => item.listing_id)),
    [purchases],
  );
  const stats = useMemo(() => ratingMap(ratings), [ratings]);
  const visible = useMemo(() => {
    const filtered = filterMarketplaceCatalog(listings, { query, filter, purchasedIds });
    return sortMarketplaceCatalog(filtered, sort, ratings);
  }, [listings, query, filter, sort, purchasedIds, ratings]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">🪙 {formatCoins(coins)} · in-app only</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/purchases"
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-sm font-semibold"
          >
            Purchases
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/marketplace"
              className="bg-accent inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-accent-ink"
            >
              Sell
            </Link>
          ) : null}
        </div>
      </div>

      {listings.length ? (
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base shadow-[var(--shadow-inset)]"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Sort</span>
              <select
                value={sort}
                aria-label="Sort products"
                className="h-11 rounded-xl border border-line bg-surface px-3 text-base"
                onChange={(event) => setSort(event.target.value as MarketplaceCatalogSort)}
              >
                {catalogSorts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {catalogFilters.map((item) => (
              <button key={item.id} type="button" className={choiceClass(filter === item.id)} onClick={() => setFilter(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">
            {visible.length} of {listings.length} {listings.length === 1 ? "product" : "products"}
          </p>
          {visible.length ? (
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((listing) => (
                <li key={listing.id}>
                  <ProductCard listing={listing} owned={purchasedIds.has(listing.id)} rating={stats.get(listing.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <Card>
              <EmptyState title="No matching products" body="Try another search, or switch back to All products." />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Nothing is on sale yet"
            body="When a seller lists a skill or other digital product, it will show up here."
          />
        </Card>
      )}
    </div>
  );
}

function ProductCard({
  listing,
  owned,
  rating,
}: {
  listing: MarketplaceListing;
  owned: boolean;
  rating?: ReviewRatingSummary;
}) {
  const cost = priceInCoins(listing.price_paise);
  const price = formatSkillPrice(listing.price_paise);
  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className={cn(
        "grid overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow)] transition hover:border-accent",
      )}
    >
      <ProductArt listing={listing} compact />
      <span className="grid gap-1 p-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {listingKindLabel(listing.kind)}
          {owned ? " · Owned" : ""}
        </span>
        <span className="line-clamp-2 text-sm font-semibold leading-5">{listing.title}</span>
        <span className="line-clamp-1 text-xs leading-5 text-muted">{listing.description}</span>
        <StarRating value={rating?.average ?? 0} count={rating?.count} size="sm" />
        <span className="flex flex-wrap items-end justify-between gap-1">
          <span className="text-sm font-semibold">{price}</span>
          {listing.price_paise > 0 ? <span className="text-xs text-muted">🪙 {formatCoins(cost)}</span> : null}
        </span>
      </span>
    </Link>
  );
}
