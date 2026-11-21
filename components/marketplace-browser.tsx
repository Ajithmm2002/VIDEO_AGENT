"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { FileArchive, FileText, Search } from "lucide-react";
import { RazorpayComingSoon } from "@/components/razorpay-coming-soon";
import { SkillPreview } from "@/components/skill-preview";
import { Button, Card, EmptyState, choiceClass } from "@/components/ui";
import { redeemListingWithCoins } from "@/lib/actions/game";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import {
  filterMarketplaceCatalog,
  listingKindLabel,
  pickMarketplaceListing,
  type MarketplaceCatalogFilter,
} from "@/lib/marketplace-catalog";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { cn } from "@/lib/utils";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

const catalogFilters: { id: MarketplaceCatalogFilter; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "skill", label: "Skills" },
  { id: "bundle", label: "Digital products" },
];

export function MarketplaceBrowser({
  listings,
  purchases,
  isAdmin,
  coins,
  selectedId = null,
}: {
  listings: MarketplaceListing[];
  purchases: MarketplacePurchase[];
  isAdmin: boolean;
  coins: number;
  selectedId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MarketplaceCatalogFilter>("all");
  const [activeId, setActiveId] = useState(selectedId);
  const byListing = useMemo(() => new Map(purchases.map((item) => [item.listing_id, item])), [purchases]);
  const purchasedIds = useMemo(
    () => new Set(purchases.filter((item) => item.status === "paid").map((item) => item.listing_id)),
    [purchases],
  );
  const visible = useMemo(() => filterMarketplaceCatalog(listings, { query, filter }), [listings, query, filter]);
  const selected = pickMarketplaceListing(listings, activeId);
  const selectedPurchase = selected ? byListing.get(selected.id) : undefined;

  function selectListing(id: string) {
    setActiveId(id);
    window.history.replaceState(null, "", `/marketplace?item=${encodeURIComponent(id)}`);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        document.getElementById("product-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">🪙 {formatCoins(coins)} · in-app only</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/purchases"
            className="inline-flex rounded-2xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow)]"
          >
            Purchases
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/marketplace"
              className="ig-gradient inline-flex rounded-2xl px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-glow)]"
            >
              Sell
            </Link>
          ) : null}
        </div>
      </div>

      {listings.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-start">
          <section className="grid gap-3">
            <div>
              <h2 className="font-semibold">On sale</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Browse every listed skill and digital product. Buy here. Downloads live in Purchases.
              </p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-3 text-sm shadow-[var(--shadow-inset)]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {catalogFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={choiceClass(filter === item.id)}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              {visible.length} of {listings.length} {listings.length === 1 ? "product" : "products"}
            </p>
            {visible.length ? (
              <div className="grid gap-2">
                {visible.map((listing) => (
                  <CatalogRow
                    key={listing.id}
                    listing={listing}
                    selected={selected?.id === listing.id}
                    owned={purchasedIds.has(listing.id)}
                    onSelect={() => selectListing(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  title="No matching products"
                  body="Try another search, or switch back to All products."
                />
              </Card>
            )}
          </section>

          <section id="product-detail" className="grid gap-3 lg:sticky lg:top-24">
            {selected ? (
              <SkillPreview listing={selected} heading="h2">
                <MarketplaceBuy listing={selected} purchase={selectedPurchase} coins={coins} />
              </SkillPreview>
            ) : (
              <Card>
                <EmptyState title="Select a product" body="Choose a listing to see details and buy." />
              </Card>
            )}
          </section>
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

function CatalogRow({
  listing,
  selected,
  owned,
  onSelect,
}: {
  listing: MarketplaceListing;
  selected: boolean;
  owned: boolean;
  onSelect: () => void;
}) {
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;
  const cost = priceInCoins(listing.price_paise);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-[var(--shadow)]",
        selected ? "border-accent/50 bg-accent/8" : "border-line bg-surface/90 hover:bg-surface-2",
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface-2 text-muted shadow-[var(--shadow-inset)]">
        <FileIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {listingKindLabel(listing.kind)}
          {owned ? " · Owned" : ""}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold">{listing.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{listing.description}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold">{formatSkillPrice(listing.price_paise)}</span>
        {listing.price_paise > 0 ? <span className="block text-[11px] text-muted">🪙 {formatCoins(cost)}</span> : null}
      </span>
    </button>
  );
}

export function MarketplaceBuy({
  listing,
  purchase,
  coins,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [openingPlay, startPlay] = useTransition();
  const pending = working || refreshing;
  const free = listing.price_paise <= 0;
  const cost = priceInCoins(listing.price_paise);
  const canCoinBuy = !free && coins >= cost;
  const paid = purchase?.status === "paid";

  async function buyWithCoins() {
    setWorking(true);
    try {
      const result = await redeemListingWithCoins(listing.id);
      if (!result.ok) {
        toast.error(result.error);
        setWorking(false);
        return;
      }
      toast.success(result.message ?? "Saved to Purchases");
      startRefresh(() => {
        router.refresh();
        setWorking(false);
      });
    } catch {
      setWorking(false);
    }
  }

  const moneyPay = (
    <RazorpayComingSoon
      title={listing.title}
      amountPaise={listing.price_paise}
      disabled={pending}
      label={`Pay ${formatSkillPrice(listing.price_paise)}`}
      note="Razorpay checkout is coming soon. This pays the listed rupee price with card, UPI, or net banking. You can also pay with studio coins if you have enough."
    />
  );

  if (paid) {
    return (
      <div className="grid gap-3 border-t border-line pt-4">
        <p className="text-sm leading-6 text-muted">You already own this. Downloads are in Purchases.</p>
        <Link
          href="/purchases"
          className="ig-gradient inline-flex h-11 items-center justify-center rounded-2xl px-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
        >
          Open Purchases
        </Link>
      </div>
    );
  }

  if (free) {
    return (
      <div className="grid gap-3 border-t border-line pt-4">
        <p className="text-2xl font-semibold">Free</p>
        <Button loading={pending} onClick={buyWithCoins} className="w-full">
          {pending ? "Unlocking…" : "Get this product"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Buy this product</p>
      <div className="grid gap-2">
        <div className="grid gap-2 rounded-2xl border border-line bg-surface-2/70 p-3 shadow-[var(--shadow-inset)]">
          <p className="text-sm font-semibold">Pay with coins</p>
          <p className="text-xs text-muted">🪙 {formatCoins(cost)}</p>
          <p className="text-xs text-muted">You have 🪙 {formatCoins(coins)}</p>
          {canCoinBuy ? (
            <Button loading={pending} disabled={pending} onClick={buyWithCoins} className="w-full">
              {pending ? "Buying…" : "Pay with coins"}
            </Button>
          ) : (
            <>
              <Button className="w-full" disabled>
                Pay with coins
              </Button>
              <p className="text-xs leading-5 text-muted">Need {formatCoins(Math.max(1, cost - coins))} more</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="secondary"
                  loading={openingPlay}
                  className="h-9 px-2 text-xs"
                  onClick={() => {
                    startPlay(() => {
                      router.push("/play");
                    });
                  }}
                >
                  Earn coins
                </Button>
                <Button
                  variant="secondary"
                  loading={openingPlay}
                  className="h-9 px-2 text-xs"
                  onClick={() => {
                    startPlay(() => {
                      router.push("/play#coin-packs");
                    });
                  }}
                >
                  Buy pack
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="grid gap-2 rounded-2xl border border-line bg-surface-2/70 p-3 shadow-[var(--shadow-inset)]">
          <p className="text-sm font-semibold">Pay with money</p>
          <p className="text-xs text-muted">{formatSkillPrice(listing.price_paise)}</p>
          <p className="text-xs text-muted">Card, UPI, or net banking</p>
          {moneyPay}
        </div>
      </div>
    </div>
  );
}
