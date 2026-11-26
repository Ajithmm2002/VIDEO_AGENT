"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { createIdeas } from "@/lib/actions/content";
import { generateFestivalContent } from "@/lib/actions/generate";
import type { FestivalIdeaDraft } from "@/lib/ai/festival-ideas";
import type { ChannelLanguage } from "@/lib/channel-profile";
import { CopyButton } from "@/components/copy-button";
import { AiThinking, Button, TextInput, choiceClass } from "@/components/ui";
import { suggestedPostDate, upcomingFestivals, type Festival } from "@/lib/festivals";
import type { Platform } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const REGIONS = ["All", "Kerala", "India", "Global"] as const;

type Entry = { festival: Festival; date: string | null };

function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function countdown(date: string, today: string) {
  const days = daysUntil(date, today);
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
}

function starterIdeas(festival: Festival): FestivalIdeaDraft[] {
  return festival.ideas.map((idea) => ({ title: idea.title, hook: "", outline: idea.howTo, caption: "", hashtags: [] }));
}

function FestivalTile({ entry, today, onOpen }: { entry: Entry; today: string; onOpen: () => void }) {
  const { festival, date } = entry;
  const day = date ? new Date(`${date}T00:00:00Z`) : null;
  const soon = date ? daysUntil(date, today) <= 14 : false;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-line bg-surface p-2.5 text-left sm:gap-3 sm:p-3 shadow-[var(--shadow)] hover:border-accent/50 hover:bg-accent-soft/40"
    >
      <span className="grid w-11 shrink-0 rounded-xl border border-line bg-surface-2 py-1.5 text-center leading-none sm:w-12">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
          {day ? day.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }) : "Date"}
        </span>
        <span className="mt-1 text-lg font-semibold tabular-nums">{day ? day.getUTCDate() : "?"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] font-semibold leading-4 sm:text-sm sm:leading-5">{festival.name}</span>
        <span className={cn("mt-0.5 block text-[11px] sm:text-xs", soon ? "font-medium text-accent" : "text-muted")}>
          {date ? countdown(date, today) : "Pick the date"}
        </span>
      </span>
      <Sparkles className="hidden h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 sm:block" aria-hidden />
    </button>
  );
}

function IdeaCard({ idea, selected, onToggle }: { idea: FestivalIdeaDraft; selected: boolean; onToggle: () => void }) {
  return (
    <li className={cn("rounded-xl border p-3", selected ? "border-accent/60 bg-accent-soft/60" : "border-line")}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-0.5 shrink-0" checked={selected} onChange={onToggle} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{idea.title}</span>
          {idea.hook ? <span className="mt-1 block text-[13px] italic leading-5 text-ink/80">“{idea.hook}”</span> : null}
          <span className="mt-1 block whitespace-pre-wrap text-[13px] leading-5 text-muted">{idea.outline}</span>
        </span>
      </label>
      {idea.caption || idea.hashtags.length ? (
        <div className="mt-2 grid gap-1.5 border-t border-line pt-2 pl-7">
          {idea.caption ? (
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-[13px] leading-5">{idea.caption}</p>
              <CopyButton text={[idea.caption, idea.hashtags.join(" ")].filter(Boolean).join("\n\n")} label="Copy caption and hashtags" compact />
            </div>
          ) : null}
          {idea.hashtags.length ? <p className="text-xs leading-5 text-accent">{idea.hashtags.join(" ")}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

function FestivalSheet({
  entry,
  today,
  configured,
  aiConnected,
  channelSummary,
  channelLanguage,
  channelPlatform,
  onClose,
}: {
  entry: Entry;
  today: string;
  configured: boolean;
  aiConnected: boolean;
  channelSummary: string | null;
  channelLanguage: ChannelLanguage;
  channelPlatform: Platform;
  onClose: () => void;
}) {
  const router = useRouter();
  const { festival } = entry;
  const [customDate, setCustomDate] = useState("");
  const [ideas, setIdeas] = useState<FestivalIdeaDraft[]>(() => starterIdeas(festival));
  const [source, setSource] = useState<"starter" | "local" | "remote">("starter");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [round, setRound] = useState(0);
  const [adding, setAdding] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const eventDate = entry.date ?? (customDate || null);
  const postDate = eventDate ? suggestedPostDate(eventDate, 3, today) : null;

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function generate() {
    setGenerating(true);
    const response = await generateFestivalContent({ festivalId: festival.id, date: eventDate });
    setGenerating(false);
    if (!response.ok) return toast.error(response.error);
    setIdeas(response.result.ideas);
    setSource(response.result.provider);
    setRound((value) => value + 1);
    setPicked(new Set());
  }

  async function addPicked() {
    setAdding(true);
    const chosen = [...picked].sort().map((index) => ideas[index]);
    const result = await createIdeas(
      chosen.map((idea) => ({
        title: idea.title.slice(0, 200),
        topic: `${festival.name}: ${idea.title}`.slice(0, 500),
        script_notes: [idea.hook ? `Hook: ${idea.hook}` : "", idea.outline].filter(Boolean).join("\n\n"),
        instagram_caption: idea.caption || null,
        hashtags: idea.hashtags,
        notes: `Festival: ${festival.name}${eventDate ? ` (${formatDate(eventDate)})` : ""}`,
        planned_date: postDate,
        platform: channelPlatform,
        language: channelLanguage === "ml" ? "ml" : "en",
      })),
    );
    setAdding(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Added");
    setPicked(new Set());
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`${festival.name} ideas`}>
      <button className="animate-veil-in absolute inset-0 bg-scrim" aria-label="Close" onClick={onClose} />
      <section className="sheet-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[var(--shadow-lg)] sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none sm:rounded-l-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{festival.name}</h2>
            <p className="text-sm text-muted">
              {entry.date ? `${formatDate(entry.date)} · ${countdown(entry.date, today)}` : festival.rule.kind === "varies" ? festival.rule.season : ""}
            </p>
          </div>
          <Button ref={closeRef} variant="ghost" className="min-h-9 min-w-9 px-0" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-5 py-4">
          {festival.note ? <p className="text-xs leading-5 text-muted">{festival.note}</p> : null}
          {festival.rule.kind === "varies" ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Festival date this year</span>
              <TextInput type="date" value={customDate} min={today} onChange={(event) => setCustomDate(event.target.value)} />
            </label>
          ) : null}

          <div className="rounded-xl border border-line bg-surface-2 p-3">
            {channelSummary ? (
              <p className="text-sm">
                <span className="text-muted">Ideas for your channel: </span>
                <span className="font-medium">{channelSummary}</span>{" "}
                <Link href="/profile#channel" className="text-sm font-semibold text-accent hover:underline">
                  Edit
                </Link>
              </p>
            ) : (
              <p className="text-sm leading-6">
                <span className="font-medium">Get ideas that fit your niche.</span>{" "}
                <span className="text-muted">Add a few lines about your channel in </span>
                <Link href="/profile#channel" className="font-semibold text-accent hover:underline">
                  Profile → About my channel
                </Link>
                .
              </p>
            )}
            <Button variant="ai" className="mt-3 w-full" loading={generating} disabled={generating} onClick={generate}>
              {generating ? null : source === "starter" ? <Sparkles className="h-4 w-4" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              {generating ? "Writing ideas…" : source === "starter" ? "Generate ideas with AI" : "Generate new ideas"}
            </Button>
            {!aiConnected ? <p className="mt-2 text-xs text-muted">AI is not connected on this site, so you get built-in ideas that use your niche.</p> : null}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {source === "starter" ? "Starter ideas" : source === "remote" ? <span className="ai-text">Written by AI for your channel</span> : "Ideas for your niche"}
            </h3>
            {generating ? (
              <div className="rounded-xl border border-line p-4">
                <AiThinking label={channelSummary ? "Writing ideas for your channel" : "Writing festival ideas"} lines={5} />
              </div>
            ) : (
              <ul key={`${source}-${round}`} className="reveal-stagger grid gap-2">
                {ideas.map((idea, index) => (
                  <IdeaCard
                    key={`${source}-${index}`}
                    idea={idea}
                    selected={picked.has(index)}
                    onToggle={() =>
                      setPicked((current) => {
                        const next = new Set(current);
                        if (next.has(index)) next.delete(index);
                        else next.add(index);
                        return next;
                      })
                    }
                  />
                ))}
              </ul>
            )}
            {source === "remote" ? <p className="mt-2 text-xs text-muted">Review AI ideas before you post, especially facts and festival customs.</p> : null}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-muted">{postDate ? `Planned for ${formatDate(postDate)}` : "Added without a date"}</p>
          <Button loading={adding} disabled={!configured || picked.size === 0 || generating} onClick={addPicked}>
            {adding ? null : picked.size ? <Plus className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
            {picked.size ? `Add ${picked.size} to Content` : "Select ideas to add"}
          </Button>
        </footer>
      </section>
    </div>
  );
}

export function FestivalPlanner({
  today,
  configured,
  aiConnected,
  channelSummary,
  channelLanguage,
  channelPlatform,
}: {
  today: string;
  configured: boolean;
  aiConnected: boolean;
  channelSummary: string | null;
  channelLanguage: ChannelLanguage;
  channelPlatform: Platform;
}) {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Entry | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const list = useMemo(() => upcomingFestivals(today), [today]);
  const needle = query.trim().toLowerCase();
  const shown = list.filter((item) => (region === "All" || item.festival.region === region) && (!needle || item.festival.name.toLowerCase().includes(needle)));
  const groups = [
    { title: "Coming up", items: shown.filter((item) => item.date && daysUntil(item.date, today) <= 60) },
    { title: "Later this year", items: shown.filter((item) => item.date && daysUntil(item.date, today) > 60) },
    { title: "Pick the date", items: shown.filter((item) => !item.date) },
  ].filter((group) => group.items.length);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a festival" aria-label="Find a festival" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by region">
          {REGIONS.map((option) => (
            <button key={option} type="button" className={choiceClass(region === option)} aria-pressed={region === option} onClick={() => setRegion(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      {!channelSummary ? (
        <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <Sparkles className="mr-1.5 inline h-4 w-4 text-accent" aria-hidden />
          Tell us about your channel in{" "}
          <Link href="/profile#channel" className="font-semibold text-accent hover:underline">
            Profile
          </Link>{" "}
          and AI ideas will match your niche.
        </p>
      ) : null}

      {groups.length ? (
        groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{group.title}</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((item) => (
                <FestivalTile key={item.festival.id} entry={item} today={today} onOpen={() => setOpen(item)} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="text-sm text-muted">No festivals match that search.</p>
      )}

      {open ? (
        <FestivalSheet
          key={open.festival.id}
          entry={open}
          today={today}
          configured={configured}
          aiConnected={aiConnected}
          channelSummary={channelSummary}
          channelLanguage={channelLanguage}
          channelPlatform={channelPlatform}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
