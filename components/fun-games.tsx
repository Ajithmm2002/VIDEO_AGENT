"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Camera,
  Clapperboard,
  Flame,
  Gift,
  Hash,
  Heart,
  ImageIcon,
  Library,
  Moon,
  Music,
  PenLine,
  Play,
  Sparkles,
  Star,
  Sun,
  Zap,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { previewGameCoins } from "@/lib/game-coins";
import { cn } from "@/lib/utils";

const icons = [
  Sparkles, Camera, Clapperboard, Hash, CalendarDays, ImageIcon, PenLine, Library,
  Play, Heart, Star, Music, Sun, Moon, Zap, Bell, Gift, Flame,
];

type MemoryCard = { id: number; key: number; Icon: (typeof icons)[number] };

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

function memoryDeck(pairs: number): MemoryCard[] {
  const chosen = icons.slice(0, pairs);
  const doubled = [...chosen, ...chosen].map((Icon, index) => ({
    id: index,
    key: index % pairs,
    Icon,
  }));
  return shuffle(doubled);
}

const memoryLevels = [8, 12, 18];

export function MemoryMarathon({
  onBank,
}: {
  onBank: (score: number, durationMs: number) => void;
}) {
  const started = useRef(Date.now());
  const [level, setLevel] = useState(0);
  const [deck, setDeck] = useState(() => memoryDeck(memoryLevels[0]));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [lock, setLock] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [boards, setBoards] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const pairs = memoryLevels[Math.min(level, memoryLevels.length - 1)];
  const cols = pairs <= 8 ? 4 : 6;
  const tile = pairs >= 18 ? "h-8 w-8 sm:h-9 sm:w-9" : "h-10 w-10 sm:h-11 sm:w-11";
  const icon = pairs >= 18 ? "h-3.5 w-3.5" : "h-4 w-4";

  useEffect(() => {
    const tick = window.setInterval(() => setElapsed(Date.now() - started.current), 1000);
    return () => window.clearInterval(tick);
  }, []);

  function nextBoard(nextLevel: number) {
    setLevel(nextLevel);
    setDeck(memoryDeck(memoryLevels[Math.min(nextLevel, memoryLevels.length - 1)]));
    setOpen([]);
    setMatched(new Set());
    setLock(false);
  }

  function flip(index: number) {
    if (lock || open.includes(index) || matched.has(deck[index].key)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (deck[a].key === deck[b].key) {
      const streak = combo + 1;
      setCombo(streak);
      setMatched(new Set([...matched, deck[a].key]));
      setScore((value) => value + 8 + streak * 2);
      setOpen([]);
      if (matched.size + 1 === pairs) {
        setBoards((value) => value + 1);
        setScore((value) => value + 20);
        window.setTimeout(() => nextBoard(Math.min(level + 1, memoryLevels.length - 1)), 450);
      }
      return;
    }
    setCombo(0);
    setLock(true);
    window.setTimeout(() => {
      setOpen([]);
      setLock(false);
    }, 650);
  }

  const coins = previewGameCoins(score, elapsed);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Match pairs. Boards get bigger. Keep going, then bank coins.</p>
        <p className="text-sm font-semibold">
          {Math.floor(elapsed / 1000)}s · Score {score} · Combo {combo} · Board {boards + 1}
        </p>
      </div>
      <div className="mt-3 flex justify-center">
        <div className={cn("grid gap-1", cols === 4 ? "grid-cols-4" : "grid-cols-6")}>
          {deck.map((card, index) => {
            const show = open.includes(index) || matched.has(card.key);
            const Icon = card.Icon;
            return (
              <button
                key={`${boards}-${card.id}`}
                type="button"
                onClick={() => flip(index)}
                className={cn(
                  "grid place-items-center rounded-lg border text-xs shadow-[var(--shadow)]",
                  tile,
                  show ? "choice-selected" : "border-line bg-surface text-muted",
                )}
                aria-label={show ? "Open card" : "Hidden card"}
              >
                {show ? <Icon className={icon} /> : "?"}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => onBank(score, Date.now() - started.current)}>Bank this run</Button>
        <p className="text-sm text-muted">{coins ? `${coins} coins ready` : "Play 20 seconds to unlock a claim"}</p>
      </div>
    </Card>
  );
}

export function CatchEndless({
  onBank,
}: {
  onBank: (score: number, durationMs: number) => void;
}) {
  const started = useRef(Date.now());
  const scoreRef = useRef(0);
  const banked = useRef(false);
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(6);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [position, setPosition] = useState(10);
  const motion = useRef({ dir: 1, speed: 2.2 });

  function bank() {
    if (banked.current) return;
    banked.current = true;
    setRunning(false);
    onBank(scoreRef.current, Date.now() - started.current);
  }

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPosition((value) => {
        const dir = value >= 94 ? -1 : value <= 6 ? 1 : motion.current.dir;
        motion.current.dir = dir;
        return value + dir * motion.current.speed;
      });
    }, 32);
    const clock = window.setInterval(() => setElapsed(Date.now() - started.current), 1000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(clock);
    };
  }, [running]);

  function catchReel() {
    if (!running) return;
    const zone = Math.max(8, 14 - Math.floor(hits / 14));
    const hit = Math.abs(position - 50) <= zone;
    if (hit) {
      const streak = combo + 1;
      setCombo(streak);
      setHits((value) => {
        const next = value + 1;
        if (next % 12 === 0) setLives((current) => Math.min(6, current + 1));
        return next;
      });
      scoreRef.current += 5 + streak;
      setScore(scoreRef.current);
      if (hits > 0 && hits % 10 === 0) motion.current.speed = Math.min(7.5, motion.current.speed + 0.45);
    } else {
      setCombo(0);
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) bank();
    }
  }

  const coins = previewGameCoins(score, elapsed);
  const zone = Math.max(8, 14 - Math.floor(hits / 14));

  return (
    <Card>
      <p className="text-sm text-muted">Tap when the glow is in the band. Six lives, with a life back every 12 catches.</p>
      <div className="relative mt-5 h-16 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-[var(--shadow-inset)]">
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-accent/20"
          style={{ width: `${zone * 2}%` }}
        />
        <span
          className="bg-accent absolute top-2 h-12 w-12 rounded-full shadow-[var(--shadow-glow)]"
          style={{ left: `calc(${position}% - 1.5rem)` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {running ? <Button onClick={catchReel}>Catch</Button> : null}
        <Button variant="secondary" onClick={bank}>
          Bank this run
        </Button>
        <p className="text-sm font-semibold">
          {Math.floor(elapsed / 1000)}s · Score {score} · Combo {combo} · Lives {lives}
        </p>
        <p className="text-sm text-muted">{coins ? `${coins} coins ready` : "Play 20 seconds to unlock a claim"}</p>
      </div>
    </Card>
  );
}

type Spark = { id: number; x: number; y: number; born: number };

export function SparkRush({
  onBank,
}: {
  onBank: (score: number, durationMs: number) => void;
}) {
  const started = useRef(Date.now());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const banked = useRef(false);
  const [running, setRunning] = useState(true);
  const [left, setLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextId = useRef(1);

  function bank() {
    if (banked.current) return;
    banked.current = true;
    setRunning(false);
    onBank(scoreRef.current, Date.now() - started.current);
  }

  useEffect(() => {
    if (!running) return;
    const clock = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(clock);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const spawn = window.setInterval(() => {
      setSparks((current) => {
        const now = Date.now();
        const kept = current.filter((item) => now - item.born < 1600);
        const extra = left < 30 ? 2 : 1;
        const added = Array.from({ length: extra }, () => {
          const id = nextId.current;
          nextId.current += 1;
          return { id, x: 8 + Math.random() * 84, y: 10 + Math.random() * 70, born: now };
        });
        return [...kept, ...added].slice(-12);
      });
    }, left < 30 ? 460 : 620);
    return () => window.clearInterval(spawn);
  }, [running, left]);

  function pop(id: number) {
    if (!running || banked.current) return;
    setSparks((current) => current.filter((item) => item.id !== id));
    comboRef.current += 1;
    scoreRef.current += 4 + Math.min(comboRef.current, 8);
    setCombo(comboRef.current);
    setScore(scoreRef.current);
  }

  const coins = previewGameCoins(score, Date.now() - started.current);

  useEffect(() => {
    if (left === 0) bank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Tap sparks before they fade. Two minutes. Combo pays extra.</p>
        <p className="text-sm font-semibold">{left}s · Score {score} · Combo {combo}</p>
      </div>
      <div className="relative mt-4 h-72 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-[var(--shadow-inset)]">
        {sparks.map((spark) => (
          <button
            key={spark.id}
            type="button"
            onClick={() => pop(spark.id)}
            className="bg-accent absolute h-11 w-11 rounded-full shadow-[var(--shadow-glow)]"
            style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
            aria-label="Spark"
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={bank}>
          Bank this run
        </Button>
        <p className="text-sm text-muted">{coins ? `${coins} coins ready` : "Play 20 seconds to unlock a claim"}</p>
      </div>
    </Card>
  );
}
