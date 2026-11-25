import Link from "next/link";
import { CoinRewardNotice } from "@/components/coin-reward-notice";
import { formatCoinBalance, formatCoins } from "@/lib/game-coins";
import type { GameWallet } from "@/lib/game-coins";
import { Card, buttonClass } from "@/components/ui";

export function CoinBalanceCard({ wallet }: { wallet: GameWallet }) {
  return (
    <Card className="relative overflow-hidden">
      <p className="text-sm text-muted">Studio coins</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{formatCoinBalance(wallet.earned)}</p>
      <p className="mt-1 text-sm text-muted">earned in total</p>
      <p className="mt-3 text-sm font-semibold">🪙 {formatCoins(wallet.coins)} for the marketplace</p>
      <div className="mt-3">
        <CoinRewardNotice compact />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/play" className={buttonClass("primary")}>
          Play Fun mode
        </Link>
        <Link href="/play#coin-packs" className={buttonClass("secondary")}>
          Buy coins
        </Link>
        <Link href="/marketplace" className={buttonClass("secondary")}>
          Marketplace
        </Link>
        <Link href="/purchases" className={buttonClass("secondary")}>
          Purchases
        </Link>
      </div>
    </Card>
  );
}
