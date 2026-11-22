"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, Loader2, Minus, Send, X } from "lucide-react";
import { SUPPORT_QUICK_PROMPTS } from "@/lib/ai/support";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type Point = { x: number; y: number };

const STORAGE_KEY = "cs-support-pos";
const BUTTON = 48;
const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 440;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultPoint() {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  const pad = 16;
  const bottomNav = window.innerWidth < 1024 ? 88 : pad;
  return {
    x: window.innerWidth - BUTTON - pad,
    y: window.innerHeight - BUTTON - bottomNav,
  };
}

function readPoint(): Point {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPoint();
    const parsed = JSON.parse(raw) as Point;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return defaultPoint();
    return parsed;
  } catch {
    return defaultPoint();
  }
}

function fitPoint(point: Point): Point {
  if (typeof window === "undefined") return point;
  return {
    x: clamp(point.x, 8, Math.max(8, window.innerWidth - BUTTON - 8)),
    y: clamp(point.y, 8, Math.max(8, window.innerHeight - BUTTON - 8)),
  };
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<Point>({ x: 16, y: 16 });
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "hello",
      role: "assistant",
      content: "Hi. Support is on 24 hours a day. I can help with sign-in, calendar, titles and tags, the shop, coins, or a bug. What do you need?",
    },
  ]);
  const drag = useRef<{ pointerId: number; dx: number; dy: number; moved: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPoint(fitPoint(readPoint()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(point));
  }, [point, ready]);

  useEffect(() => {
    function onResize() {
      setPoint((current) => fitPoint(current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      dx: event.clientX - point.x,
      dy: event.clientY - point.y,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const next = fitPoint({ x: event.clientX - current.dx, y: event.clientY - current.dy });
    if (Math.abs(next.x - point.x) > 6 || Math.abs(next.y - point.y) > 6) current.moved = true;
    setPoint(next);
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!current.moved) setOpen((value) => !value);
  }

  async function send(text = input.trim()) {
    if (!text || pending) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await response.json()) as { ok?: boolean; reply?: string; error?: string };
      const reply = data.ok && data.reply ? data.reply : data.error || "I could not reach support just now. Try again in a moment.";
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: "The support chat could not send that. Check your connection and try again." },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  const panelLeft = point.x + BUTTON + 12 + PANEL_WIDTH > (typeof window === "undefined" ? 0 : window.innerWidth)
    ? Math.max(8, point.x - PANEL_WIDTH - 12)
    : point.x;
  const panelTop = point.y + BUTTON + 12 + PANEL_HEIGHT > (typeof window === "undefined" ? 0 : window.innerHeight)
    ? Math.max(8, point.y - PANEL_HEIGHT - 12)
    : point.y + BUTTON + 12;

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {open ? (
        <section
          className="pointer-events-auto absolute flex max-h-[min(28rem,72vh)] w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow)]"
          style={{ left: panelLeft, top: panelTop }}
          role="dialog"
          aria-modal="true"
          aria-label="Support chat"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div>
              <p className="text-base font-semibold">Support</p>
              <p className="text-sm text-muted">Always on · replies instantly</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-2" aria-label="Minimise support chat" onClick={() => setOpen(false)}>
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" className="grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-2" aria-label="Close support chat" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div ref={listRef} className="grid min-h-0 flex-1 gap-2 overflow-y-auto px-3 py-3">
            {messages.map((item) => (
              <p
                key={item.id}
                className={cn(
                  "max-w-[90%] rounded-md px-3 py-2 text-base leading-6 sm:text-sm",
                  item.role === "user" ? "ml-auto bg-accent text-white" : "bg-surface-2 text-ink",
                )}
              >
                {item.content}
              </p>
            ))}
            {pending ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Thinking…
              </p>
            ) : null}
            {messages.length < 3 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUPPORT_QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="inline-flex min-h-11 items-center rounded-md border border-line bg-bg px-3 text-sm font-medium"
                    onClick={() => void send(prompt)}
                    disabled={pending}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <form
            className="flex items-center gap-2 border-t border-line p-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              placeholder="Ask about this app"
              aria-label="Support message"
              className="h-11 min-w-0 flex-1 rounded-md border border-line bg-bg px-3 text-base"
            />
            <button
              type="submit"
              className="ig-gradient grid h-11 w-11 place-items-center rounded-md text-white disabled:opacity-60"
              disabled={pending || !input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}
      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? "Move or close support chat" : "Open support chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        className="pointer-events-auto absolute grid h-12 w-12 touch-none place-items-center rounded-full bg-accent text-white shadow-[var(--shadow-glow)]"
        style={{ left: point.x, top: point.y }}
      >
        <Headset className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
