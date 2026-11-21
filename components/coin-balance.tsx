import Link from "next/link";
import { formatCoinBalance, formatCoins } from "@/lib/game-coins";
import type { GameWallet } from "@/lib/game-coins";
import { Card } from "@/components/ui";

export function CoinBalanceCard({ wallet }: { wallet: GameWallet }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1 ig-gradient" />
      <p className="text-sm text-muted">Studio coins</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight">{formatCoinBalance(wallet.earned)}</p>
      <p className="mt-1 text-sm text-muted">earned in total</p>
      <p className="mt-3 text-sm font-semibold">🪙 {formatCoins(wallet.coins)} to spend</p>
      <p className="mt-1 text-xs text-muted">100 coins = ₹1</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/play" className="ig-gradient inline-flex rounded-2xl px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]">
          Play Fun mode
        </Link>
        <Link href="/marketplace" className="inline-flex rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]">
          Skill shop
        </Link>
      </div>
    </Card>
  );
}
