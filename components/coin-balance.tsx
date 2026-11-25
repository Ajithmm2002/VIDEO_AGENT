import Link from "next/link";
import { CoinRewardNotice } from "@/components/coin-reward-notice";
import { formatCoinBalance, formatCoins } from "@/lib/game-coins";
import type { GameWallet } from "@/lib/game-coins";
import { Card } from "@/components/ui";

export function CoinBalanceCard({ wallet }: { wallet: GameWallet }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <p className="text-sm text-muted">Studio coins</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight">{formatCoinBalance(wallet.earned)}</p>
      <p className="mt-1 text-sm text-muted">earned in total</p>
      <p className="mt-3 text-sm font-semibold">🪙 {formatCoins(wallet.coins)} for the marketplace</p>
      <div className="mt-3">
        <CoinRewardNotice compact />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/play" className="bg-accent inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-accent-ink">
          Play Fun mode
        </Link>
        <Link href="/play#coin-packs" className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-semibold">
          Buy coins
        </Link>
        <Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-semibold">
          Marketplace
        </Link>
        <Link href="/purchases" className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3.5 text-sm font-semibold">
          Purchases
        </Link>
      </div>
    </Card>
  );
}
