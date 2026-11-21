"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { FileArchive, FileText } from "lucide-react";
import { CoinPacks } from "@/components/coin-packs";
import { CoinRewardNotice } from "@/components/coin-reward-notice";
import { ComingSoonNotice } from "@/components/coming-soon";
import { RazorpayComingSoon } from "@/components/razorpay-coming-soon";
import { ShopPaths } from "@/components/shop-paths";
import { SkillPreview } from "@/components/skill-preview";
import { Button, Card, EmptyState } from "@/components/ui";
import { redeemListingWithCoins } from "@/lib/actions/game";
import { formatCoins, priceInCoins } from "@/lib/game-coins";
import { formatSkillPrice } from "@/lib/marketplace-file";
import { cn } from "@/lib/utils";
import type { MarketplaceListing, MarketplacePurchase } from "@/lib/types";

export function MarketplaceBrowser({
  listings,
  purchases,
  isAdmin,
  coins,
}: {
  listings: MarketplaceListing[];
  purchases: MarketplacePurchase[];
  isAdmin: boolean;
  coins: number;
}) {
  const byListing = new Map(purchases.map((item) => [item.listing_id, item]));
  const [openId, setOpenId] = useState<string | null>(null);
  const openListing = listings.find((item) => item.id === openId) ?? null;
  const closeSkill = useCallback(() => setOpenId(null), []);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">🪙 {formatCoins(coins)} · in-app shop only</p>
        {isAdmin ? (
          <Link
            href="/admin/marketplace"
            className="ig-gradient inline-flex rounded-2xl px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-glow)]"
          >
            Admin desk
          </Link>
        ) : null}
      </div>
      <ComingSoonNotice
        title="Razorpay checkout is next"
        body="Buy coin packs or skills with rupees when Razorpay is ready. You can also earn coins in Fun mode and redeem them here. Coins are not cash."
      />
      <ShopPaths />
      <CoinPacks />
      <CoinRewardNotice />
      <div>
        <h2 className="font-semibold">Digital skills</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Redeem studio coins, or buy the same skill with rupees. Both unlock the same download.
        </p>
      </div>
      {listings.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.map((listing) => (
            <MarketplaceBuy
              key={listing.id}
              listing={listing}
              purchase={byListing.get(listing.id)}
              coins={coins}
              compact
              onOpen={() => setOpenId(listing.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No skills on the shelf yet"
            body="When the shop owner lists a skill, it will show up here with a description, offerings, and a price."
          />
        </Card>
      )}
      {openListing ? (
        <SkillQuickView
          listing={openListing}
          purchase={byListing.get(openListing.id)}
          coins={coins}
          onClose={closeSkill}
        />
      ) : null}
    </div>
  );
}

function SkillQuickView({
  listing,
  purchase,
  coins,
  onClose,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="animate-veil-in fixed inset-0 z-[90] grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-[#12040c]/62 backdrop-blur-md" aria-label="Close skill" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-pop-in relative z-10 w-[min(28rem,100%)] outline-none"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p id={titleId} className="text-sm font-semibold">
            Skill
          </p>
          <Button variant="secondary" className="h-8 px-3 py-1 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
        <SkillPreview listing={listing} heading="h2">
          <MarketplaceBuy listing={listing} purchase={purchase} coins={coins} />
        </SkillPreview>
        <div className="mt-3">
          <CoinRewardNotice compact />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MarketplaceBuy({
  listing,
  purchase,
  coins,
  compact = false,
  onOpen,
}: {
  listing: MarketplaceListing;
  purchase?: MarketplacePurchase;
  coins: number;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [openingPlay, startPlay] = useTransition();
  const pending = working || refreshing;
  const free = listing.price_paise <= 0;
  const cost = priceInCoins(listing.price_paise);
  const canCoinBuy = !free && coins >= cost;
  const paid = purchase?.status === "paid";
  const FileIcon = listing.file_ext === "zip" ? FileArchive : FileText;
  const compactBtn = compact ? "h-8 w-full px-2 py-1 text-xs" : "w-full";

  async function buyWithCoins() {
    setWorking(true);
    try {
      const result = await redeemListingWithCoins(listing.id);
      if (!result.ok) {
        toast.error(result.error);
        setWorking(false);
        return;
      }
      toast.success(result.message ?? "Saved");
      startRefresh(() => {
        router.refresh();
        setWorking(false);
      });
    } catch {
      setWorking(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/marketplace/download?id=${listing.id}`, { redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("Location");
        if (location) {
          window.location.assign(location);
          return;
        }
      }
      if (!response.ok && response.type !== "opaqueredirect") {
        const message = await response.text();
        toast.error(message || "Could not download.");
        return;
      }
      window.location.assign(`/api/marketplace/download?id=${listing.id}`);
    } catch {
      window.location.assign(`/api/marketplace/download?id=${listing.id}`);
    } finally {
      window.setTimeout(() => setDownloading(false), 1600);
    }
  }

  function openSkill(event: React.MouseEvent<HTMLElement>) {
    if (!onOpen) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpen();
  }

  const actions = paid ? (
    <Button loading={downloading} onClick={download} className={compactBtn}>
      {downloading ? "Downloading…" : "Download"}
    </Button>
  ) : free ? (
    <Button loading={pending} onClick={buyWithCoins} className={compactBtn}>
      {pending ? "Buying…" : "Get this skill"}
    </Button>
  ) : (
    <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
      {canCoinBuy ? (
        <Button variant="secondary" loading={pending} disabled={pending} onClick={buyWithCoins} className={compactBtn}>
          {pending ? "Buying…" : compact ? "Coins" : "Pay with coins"}
        </Button>
      ) : (
        <Button
          variant="secondary"
          loading={openingPlay}
          className={compactBtn}
          onClick={() => {
            startPlay(() => {
              router.push("/play");
            });
          }}
        >
          {openingPlay ? "Opening…" : "Earn coins"}
        </Button>
      )}
      <RazorpayComingSoon title={listing.title} amountPaise={listing.price_paise} compact={compact} disabled={pending || downloading} />
    </div>
  );

  if (compact) {
    return (
      <article
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-[var(--shadow)]"
        onClick={(event) => {
          if (!onOpen) return;
          if ((event.target as HTMLElement).closest("button, a")) return;
          onOpen();
        }}
      >
        <Link
          href={`/marketplace/${listing.id}`}
          prefetch
          onClick={openSkill}
          className="grid h-28 place-items-center bg-surface-2/80"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface text-muted shadow-[var(--shadow-inset)]">
            <FileIcon className="h-5 w-5" />
          </span>
        </Link>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {listing.kind === "bundle" ? "Bundle" : "Skill"}
          </p>
          <Link
            href={`/marketplace/${listing.id}`}
            prefetch
            onClick={openSkill}
            className="line-clamp-2 text-sm font-semibold leading-5 hover:text-accent"
          >
            {listing.title}
          </Link>
          <p className="line-clamp-2 text-xs leading-4 text-muted">{listing.description}</p>
          <div className="mt-auto pt-1">
            <p className="text-base font-semibold">{formatSkillPrice(listing.price_paise)}</p>
            {free ? null : <p className="text-[11px] text-muted">🪙 {formatCoins(cost)}</p>}
            <div className="relative z-10 mt-2">{actions}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <div>
        <p className="text-2xl font-semibold">{formatSkillPrice(listing.price_paise)}</p>
        {free ? null : <p className="mt-0.5 text-sm text-muted">🪙 {formatCoins(cost)}</p>}
      </div>
      {actions}
    </div>
  );
}
