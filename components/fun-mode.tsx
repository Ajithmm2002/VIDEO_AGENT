"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CatchEndless, MemoryMarathon, SparkRush } from "@/components/fun-games";
import { Button, Card, choiceClass } from "@/components/ui";
import { claimGameCoins } from "@/lib/actions/game";
import { formatCoins, previewGameCoins, type GameId } from "@/lib/game-coins";

const games = [
  { id: "memory" as const, label: "Memory marathon" },
  { id: "catch" as const, label: "Catch the reel" },
  { id: "sparks" as const, label: "Spark rush" },
];

export function FunMode({ coins }: { coins: number }) {
  const router = useRouter();
  const [game, setGame] = useState<GameId>("memory");
  const [run, setRun] = useState(0);
  const [balance, setBalance] = useState(coins);
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
          <p className="ig-text text-[11px] font-semibold uppercase tracking-[0.18em]">Studio coins</p>
          <p className="mt-1 text-2xl font-semibold">{formatCoins(balance)}</p>
          <p className="mt-1 text-sm text-muted">
            1 coin = ₹1. Up to 18 coins per run, 500 per day.{" "}
            <Link href="/marketplace" className="font-semibold text-accent">
              Spend in the skill shop
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
