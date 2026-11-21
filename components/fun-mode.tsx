"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Clapperboard, Hash, Sparkles } from "lucide-react";
import { Button, Card, choiceClass } from "@/components/ui";
import { cn } from "@/lib/utils";

const games = [
  { id: "memory", label: "Memory reels" },
  { id: "catch", label: "Catch the reel" },
] as const;

type GameId = (typeof games)[number]["id"];

export function FunMode() {
  const [game, setGame] = useState<GameId>("memory");

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {games.map((item) => (
          <button key={item.id} type="button" className={choiceClass(game === item.id)} onClick={() => setGame(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {game === "memory" ? <MemoryGame /> : <CatchGame />}
    </div>
  );
}

const faces = [Sparkles, Camera, Clapperboard, Hash, Sparkles, Camera, Clapperboard, Hash];

function freshDeck() {
  return shuffle(faces.map((Icon, index) => ({ id: index, Icon, key: String(index % 4) })));
}

function MemoryGame() {
  const [deck, setDeck] = useState(freshDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const won = matched.size === 4;

  function flip(index: number) {
    if (lock || open.includes(index) || matched.has(deck[index].key)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((value) => value + 1);
    const [a, b] = next;
    if (deck[a].key === deck[b].key) {
      setMatched(new Set([...matched, deck[a].key]));
      setOpen([]);
      return;
    }
    setLock(true);
    window.setTimeout(() => {
      setOpen([]);
      setLock(false);
    }, 700);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Flip two cards. Match the studio icons.</p>
        <p className="text-sm font-semibold">{won ? `Done in ${moves} moves` : `${moves} moves`}</p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {deck.map((card, index) => {
          const show = open.includes(index) || matched.has(card.key);
          const Icon = card.Icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(index)}
              className={cn(
                "grid aspect-square place-items-center rounded-[1.4rem] border text-lg shadow-[var(--shadow)]",
                show ? "choice-selected" : "border-line bg-surface text-muted",
              )}
              aria-label={show ? card.key : "Hidden card"}
            >
              {show ? <Icon className="h-6 w-6" /> : "?"}
            </button>
          );
        })}
      </div>
      {won ? (
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setDeck(freshDeck());
            setOpen([]);
            setMatched(new Set());
            setMoves(0);
            setLock(false);
          }}
        >
          Play again
        </Button>
      ) : null}
    </Card>
  );
}

function CatchGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [position, setPosition] = useState(8);
  const motion = useRef({ dir: 1, tries: 0 });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPosition((value) => {
        const dir = value >= 92 ? -1 : value <= 8 ? 1 : motion.current.dir;
        motion.current.dir = dir;
        return value + dir * 4;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [running]);

  function start() {
    motion.current = { dir: 1, tries: 0 };
    setScore(0);
    setTries(0);
    setPosition(8);
    setRunning(true);
  }

  function catchReel() {
    if (!running) return;
    const hit = Math.abs(position - 50) <= 10;
    const nextTries = tries + 1;
    setTries(nextTries);
    if (hit) setScore((value) => value + 1);
    if (nextTries >= 8) setRunning(false);
  }

  return (
    <Card>
      <p className="text-sm text-muted">Tap when the glow sits in the middle band. Eight tries.</p>
      <div className="relative mt-5 h-16 overflow-hidden rounded-[1.5rem] border border-line bg-surface-2 shadow-[var(--shadow-inset)]">
        <div className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-accent/18" />
        <span
          className="ig-gradient absolute top-2 h-12 w-12 rounded-full shadow-[var(--shadow-glow)]"
          style={{ left: `calc(${position}% - 1.5rem)` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {running ? (
          <Button onClick={catchReel}>Catch</Button>
        ) : (
          <Button onClick={start}>{tries ? "Play again" : "Start"}</Button>
        )}
        <p className="text-sm font-semibold">{score} hits · {tries}/8 tries</p>
      </div>
    </Card>
  );
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}
