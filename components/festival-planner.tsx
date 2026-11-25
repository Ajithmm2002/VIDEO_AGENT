"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Check, Plus } from "lucide-react";
import { createIdeas } from "@/lib/actions/content";
import { Button, Card, TextInput, choiceClass } from "@/components/ui";
import { suggestedPostDate, upcomingFestivals, type Festival } from "@/lib/festivals";
import { formatDate } from "@/lib/utils";

const REGIONS = ["All", "Kerala", "India", "Global"] as const;

function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function FestivalCard({ festival, date, today, configured }: { festival: Festival; date: string | null; today: string; configured: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [customDate, setCustomDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const eventDate = date ?? (customDate || null);
  const postDate = eventDate ? suggestedPostDate(eventDate, 3, today) : null;
  const away = date ? daysUntil(date, today) : null;

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{festival.name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {date
              ? `${formatDate(date)} · ${away === 0 ? "today" : away === 1 ? "tomorrow" : `in ${away} days`}`
              : festival.rule.kind === "varies"
                ? festival.rule.season
                : ""}
          </p>
        </div>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">{festival.region}</span>
      </div>
      {festival.note ? <p className="mt-2 text-xs leading-5 text-muted">{festival.note}</p> : null}

      <ul className="mt-4 grid gap-2">
        {festival.ideas.map((idea, index) => {
          const on = picked.has(index);
          return (
            <li key={idea.title}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-surface-2 has-[:checked]:border-accent/50 has-[:checked]:bg-accent-soft">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={on}
                  onChange={() =>
                    setPicked((current) => {
                      const next = new Set(current);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    })
                  }
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{idea.title}</span>
                  <span className="block text-xs leading-5 text-muted">{idea.howTo}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:mt-auto">
        {festival.rule.kind === "varies" ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Festival date this year</span>
            <TextInput type="date" value={customDate} min={today} onChange={(event) => setCustomDate(event.target.value)} />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">{postDate ? `Will be planned for ${formatDate(postDate)}` : "Add without a date, or pick the festival date first."}</p>
          <Button
            variant={added ? "secondary" : "primary"}
            loading={busy}
            disabled={!configured || picked.size === 0}
            onClick={async () => {
              setBusy(true);
              const ideas = [...picked].sort().map((index) => ({
                title: festival.ideas[index].title,
                topic: `${festival.name}: ${festival.ideas[index].title}`,
                notes: [`How to shoot: ${festival.ideas[index].howTo}`, `Festival: ${festival.name}${eventDate ? ` (${formatDate(eventDate)})` : ""}`].join("\n\n"),
                planned_date: postDate,
              }));
              const result = await createIdeas(ideas);
              setBusy(false);
              if (!result.ok) return toast.error(result.error);
              toast.success(result.message ?? "Added");
              setPicked(new Set());
              setAdded(true);
              router.refresh();
            }}
          >
            {added && picked.size === 0 ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
            {added && picked.size === 0 ? "Added" : picked.size ? `Add ${picked.size} to Content` : "Add to Content"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function FestivalPlanner({ today, configured }: { today: string; configured: boolean }) {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");
  const list = useMemo(() => upcomingFestivals(today), [today]);
  const shown = list.filter((item) => region === "All" || item.festival.region === region);
  const soon = shown.filter((item) => item.date && daysUntil(item.date, today) <= 60);
  const later = shown.filter((item) => !soon.includes(item));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by region">
        {REGIONS.map((option) => (
          <button key={option} type="button" className={choiceClass(region === option)} aria-pressed={region === option} onClick={() => setRegion(option)}>
            {option}
          </button>
        ))}
      </div>
      {soon.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">Next 60 days</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {soon.map((item) => (
              <FestivalCard key={item.festival.id} festival={item.festival} date={item.date} today={today} configured={configured} />
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">Later this year</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {later.map((item) => (
            <FestivalCard key={item.festival.id} festival={item.festival} date={item.date} today={today} configured={configured} />
          ))}
        </div>
      </section>
    </div>
  );
}
