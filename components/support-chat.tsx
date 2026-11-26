"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, BookOpen, RotateCcw, Sparkles, X } from "lucide-react";
import { SUPPORT_QUICK_PROMPTS } from "@/lib/ai/support-public";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  suggestions?: string[];
};

/** The launcher sits on the left or right edge; y is a share of the screen height so it survives resizes. */
type Dock = { side: "left" | "right"; y: number };

const DOCK_KEY = "cs-support-dock";
const HISTORY_KEY = "cs-support-chat";
const BUTTON = 52;
const EDGE = 16;

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I answer from the Content Studio guide. Ask how a page works, or paste the exact error you see.",
  suggestions: [...SUPPORT_QUICK_PROMPTS],
};

function bottomReserve() {
  return window.innerWidth < 1024 ? 88 : EDGE;
}

function defaultDock(): Dock {
  const y = window.innerHeight - BUTTON - bottomReserve();
  return { side: "right", y: y / window.innerHeight };
}

function readDock(): Dock {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCK_KEY) ?? "null") as Dock | null;
    if (parsed && (parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") return parsed;
  } catch {
    // Use the default position.
  }
  return defaultDock();
}

function readHistory(): ChatMessage[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "null") as ChatMessage[] | null;
    if (Array.isArray(parsed) && parsed.length) return parsed.slice(-30);
  } catch {
    // Start a fresh chat.
  }
  return [WELCOME];
}

function dockTop(dock: Dock) {
  const max = window.innerHeight - BUTTON - bottomReserve();
  return Math.min(Math.max(dock.y * window.innerHeight, EDGE + 56), Math.max(max, EDGE));
}

export function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dock, setDock] = useState<Dock>(readDock);
  const [dragTop, setDragTop] = useState<{ x: number; y: number } | null>(null);
  const [, forceLayout] = useState(0);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(readHistory);
  const drag = useRef<{ pointerId: number; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DOCK_KEY, JSON.stringify(dock));
    } catch {
      // Position just won't persist.
    }
  }, [dock]);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // History just won't persist.
    }
  }, [messages]);

  useEffect(() => {
    function onResize() {
      forceLayout((value) => value + 1);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

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

  const top = dockTop(dock);
  const left = dock.side === "right" ? window.innerWidth - BUTTON - EDGE : EDGE;

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      dx: event.clientX - left,
      dy: event.clientY - top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
    current.moved = true;
    setDragTop({ x: event.clientX - current.dx, y: event.clientY - current.dy });
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!current.moved) {
      setOpen((value) => !value);
      return;
    }
    // Snap to the nearest side so the launcher never covers the middle of a page.
    const x = event.clientX - current.dx + BUTTON / 2;
    const y = event.clientY - current.dy;
    setDock({ side: x < window.innerWidth / 2 ? "left" : "right", y: y / window.innerHeight });
    setDragTop(null);
  }

  async function send(raw = input) {
    const text = raw.trim();
    if (!text || pending) return;
    const history = messages
      .filter((item) => item.id !== "welcome")
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    setPending(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, page: pathname }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        sources?: string[];
        suggestions?: string[];
        error?: string;
      };
      setMessages((current) => [
        ...current,
        data.ok && data.reply
          ? { id: crypto.randomUUID(), role: "assistant", content: data.reply, sources: data.sources, suggestions: data.suggestions }
          : { id: crypto.randomUUID(), role: "assistant", content: data.error || "I could not reach support just now. Try again in a moment." },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: "That message did not send. Check your connection and try again." },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
  // Public creator pages and review links are for visitors, not studio users.
  if (/^\/(c|share|go|offline)(\/|$)/.test(pathname)) return null;
  const position = dragTop ?? { x: left, y: top };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {open ? (
        <section
          className={cn(
            "animate-pop-in pointer-events-auto absolute flex flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-lg)]",
            "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            "sm:inset-x-auto sm:bottom-auto sm:h-[min(34rem,calc(100dvh-6rem))] sm:w-[24rem] sm:rounded-2xl sm:pb-0",
          )}
          style={
            typeof window !== "undefined" && window.innerWidth >= 640
              ? {
                  top: Math.max(EDGE, Math.min(top + BUTTON - 34 * 16, window.innerHeight - 34 * 16 - EDGE)),
                  ...(dock.side === "right" ? { right: BUTTON + EDGE * 2 } : { left: BUTTON + EDGE * 2 }),
                }
              : undefined
          }
          role="dialog"
          aria-label="Help chat"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="ai-badge grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-[var(--ai-glow)]" aria-hidden>
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Help</p>
                <p className="truncate text-xs text-muted">Answers from the studio guide · 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Start a new chat"
                title="New chat"
                onClick={() => setMessages([WELCOME])}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Close help chat"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((item) => (
              <div key={item.id} className={cn("animate-fade-up flex max-w-[88%] flex-col gap-1.5", item.role === "user" ? "self-end items-end" : "self-start")}>
                <p
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    item.role === "user" ? "rounded-br-md bg-accent text-accent-ink" : "rounded-bl-md bg-surface-2 text-ink",
                  )}
                >
                  {item.content}
                </p>
                {item.role === "assistant" && item.sources?.length ? (
                  <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted">
                    <BookOpen className="h-3 w-3" aria-hidden />
                    From: {item.sources.join(" · ")}
                  </p>
                ) : null}
                {item === lastAssistant && item.suggestions?.length && !pending ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {item.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs font-medium hover:border-accent/50 hover:bg-accent-soft hover:text-accent"
                        onClick={() => void send(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {pending ? (
              <div className="grid w-56 gap-2 self-start rounded-2xl rounded-bl-md bg-surface-2/60 px-4 py-3" role="status" aria-label="Writing a reply">
                <span className="flex items-center gap-1.5 text-xs font-semibold" aria-hidden>
                  <Sparkles className="ai-sparkle-spin h-3.5 w-3.5 text-[var(--ai-2)]" />
                  <span className="ai-text">Thinking…</span>
                </span>
                <span className="ai-shimmer-line w-full" aria-hidden />
                <span className="ai-shimmer-line w-3/4" style={{ animationDelay: "120ms" }} aria-hidden />
              </div>
            ) : null}
          </div>

          <form
            className="ai-glow m-3 flex items-end gap-2 rounded-2xl bg-bg p-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              maxLength={500}
              placeholder="Ask a question…"
              aria-label="Your question"
              className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-xl border-0 bg-transparent px-2.5 py-2 text-base leading-6 shadow-none focus-visible:outline-none sm:text-sm"
            />
            <button
              type="submit"
              className="ai-badge grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-[var(--ai-glow)] disabled:opacity-40 disabled:shadow-none"
              disabled={pending || !input.trim()}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? "Close help chat" : "Open help chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Help · drag to move"
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
        className={cn(
          "ai-badge pointer-events-auto absolute grid touch-none place-items-center rounded-full shadow-[var(--ai-glow)] hover:brightness-110",
          open ? "max-sm:hidden" : "",
          dragTop ? "cursor-grabbing" : "transition-[left,top] duration-200",
        )}
        style={{ left: position.x, top: position.y, width: BUTTON, height: BUTTON }}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Sparkles className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  );
}
