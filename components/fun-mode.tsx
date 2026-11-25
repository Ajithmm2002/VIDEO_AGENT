"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CoinPacks } from "@/components/coin-packs";
import { CoinRewardNotice } from "@/components/coin-reward-notice";
import { ShopPaths } from "@/components/shop-paths";
import { CatchEndless, MemoryMarathon, SparkRush } from "@/components/fun-games";
import { Button, Card, choiceClass } from "@/components/ui";
import { claimGameCoins } from "@/lib/actions/game";
import { formatCoinBalance, formatCoins, previewGameCoins, type GameId } from "@/lib/game-coins";

const games = [
  { id: "memory" as const, label: "Memory marathon" },
  { id: "catch" as const, label: "Catch the reel" },
  { id: "sparks" as const, label: "Spark rush" },
];

export function FunMode({ coins, earned }: { coins: number; earned: number }) {
  const router = useRouter();
  const [game, setGame] = useState<GameId>("memory");
  const [run, setRun] = useState(0);
  const [balance, setBalance] = useState(coins);
  const [totalEarned, setTotalEarned] = useState(earned);
  const [pending, setPending] = useState<{ game: GameId; score: number; durationMs: number } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const ready = pending ? previewGameCoins(pending.score, pending.durationMs) : 0;

  function bank(nextGame: GameId, score: number, durationMs: number) {
    setPending({ game: nextGame, score, durationMs });
  }

  return (
    <div className="grid gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">Studio coins</p>
          <p className="mt-1 text-2xl font-semibold">{formatCoinBalance(totalEarned)}</p>
          <p className="mt-1 text-sm font-semibold">earned in total · {formatCoins(balance)} for this shop</p>
          <p className="mt-1 text-sm text-muted">
            Up to 12 coins per run, 400 a day. Earn by playing, or buy a pack below.{" "}
            <Link href="/marketplace" className="font-semibold text-accent">
              Spend them in the marketplace
            </Link>
          </p>
        </div>
        {pending ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{ready ? `${ready} coins from this run` : "Keep playing to 20 seconds"}</p>
            <Button
              loading={claiming}
              disabled={!ready}
              onClick={async () => {
                if (!pending) return;
                setClaiming(true);
                try {
                  const result = await claimGameCoins(pending);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(result.message ?? "Coins claimed");
                  if (typeof result.balance === "number") setBalance(result.balance);
                  if (typeof result.earned === "number") setTotalEarned(result.earned);
                  else if (typeof result.awarded === "number") {
                    const awarded = result.awarded;
                    setTotalEarned((value) => value + awarded);
                  }
                  setPending(null);
                  setRun((value) => value + 1);
                  router.refresh();
                } finally {
                  setClaiming(false);
                }
              }}
            >
              {claiming ? "Claiming…" : "Claim coins"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPending(null);
                setRun((value) => value + 1);
              }}
            >
              New run
            </Button>
          </div>
        ) : null}
      </Card>
      <CoinRewardNotice />
      <ShopPaths />
      <CoinPacks />
      <div className="flex flex-wrap gap-2">
        {games.map((item) => (
          <button
            key={item.id}
            type="button"
            className={choiceClass(game === item.id)}
            onClick={() => {
              setGame(item.id);
              setRun((value) => value + 1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {game === "memory" ? (
        <MemoryMarathon key={`memory-${run}`} onBank={(score, durationMs) => bank("memory", score, durationMs)} />
      ) : null}
      {game === "catch" ? (
        <CatchEndless key={`catch-${run}`} onBank={(score, durationMs) => bank("catch", score, durationMs)} />
      ) : null}
      {game === "sparks" ? (
        <SparkRush key={`sparks-${run}`} onBank={(score, durationMs) => bank("sparks", score, durationMs)} />
      ) : null}
    </div>
  );
}
