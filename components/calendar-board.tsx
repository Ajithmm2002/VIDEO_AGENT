"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePlannedDate } from "@/lib/actions/content";
import { Loader2 } from "lucide-react";
import { statusColors, statusLabels } from "@/lib/labels";
import type { Content } from "@/lib/types";
import { cn } from "@/lib/utils";

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="calendar-date mt-1 h-8 w-full min-w-0 max-w-full rounded-md border border-line bg-surface px-1.5 text-[11px] text-ink"
    />
  );
}

export function CalendarBoard({
  days,
  dated,
  undated,
  today,
  activeMonth,
}: {
  days: string[];
  dated: Content[];
  undated: Content[];
  today: string;
  activeMonth?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);

  function move(id: string, date: string | null) {
    startTransition(async () => {
      const result = await updatePlannedDate(id, date);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={cn("grid gap-4", pending && "pointer-events-none opacity-70")} aria-busy={pending || undefined}>
      {pending ? (
        <p className="flex items-center gap-2 text-sm font-medium text-accent">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Updating calendar…
        </p>
      ) : null}
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <div className="min-w-[48rem] overflow-hidden rounded-md border border-line sm:min-w-[56rem]">
          <div className="grid grid-cols-7 bg-surface-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-line">
            {days.map((day) => {
              const items = dated.filter((item) => item.planned_date === day);
              const muted = Boolean(activeMonth) && !day.startsWith(activeMonth ?? "");
              return (
                <div
                  key={day}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(day);
                  }}
                  onDragLeave={() => setDragOver((current) => (current === day ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(null);
                    const id = event.dataTransfer.getData("text/plain");
                    if (id) move(id, day);
                  }}
                  className={cn(
                    "flex min-h-36 min-w-0 flex-col overflow-hidden bg-surface p-2",
                    day === today && "bg-accent/10 ring-1 ring-inset ring-accent/40",
                    dragOver === day && "bg-accent/15",
                    muted && "bg-bg-2 text-muted",
                  )}
                >
                  <div
                    className={cn(
                      "mb-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      day === today ? "ig-gradient text-accent-ink" : "text-muted",
                    )}
                  >
                    {Number(day.slice(8))}
                  </div>
                  <div className="grid min-w-0 gap-1">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                        className="min-w-0 cursor-grab overflow-hidden rounded-md bg-surface-2 p-2 text-xs active:cursor-grabbing"
                      >
                        <Link href={`/content/${item.id}`} className="block truncate font-medium hover:text-accent">
                          {item.title}
                        </Link>
                        <p
                          className="mt-1 flex min-w-0 items-center gap-1 font-medium"
                          style={{ color: statusColors[item.status] }}
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusColors[item.status] }} />
                          <span className="truncate">{statusLabels[item.status]}</span>
                        </p>
                        <DateField
                          label={`Move ${item.title}`}
                          value={item.planned_date ?? ""}
                          onChange={(value) => move(item.id, value || null)}
                        />
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="rounded-md border border-line bg-surface p-5">
        <h2 className="font-semibold">No date yet</h2>
        <p className="mb-4 text-sm leading-6 text-muted">
          Drag a card onto a day, or pick a date. This list shows content that has no publishing date.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {undated.length ? (
            undated.map((item) => (
              <article
                key={item.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                className="min-w-0 cursor-grab rounded-md border border-line bg-surface-2 p-3 text-sm active:cursor-grabbing"
              >
                <Link href={`/content/${item.id}`} className="block truncate font-medium hover:text-accent">
                  {item.title}
                </Link>
                <DateField
                  label={`Schedule ${item.title}`}
                  onChange={(value) => {
                    if (value) move(item.id, value);
                  }}
                />
              </article>
            ))
          ) : (
            <p className="text-sm text-muted sm:col-span-2 xl:col-span-3">No undated content in this filter.</p>
          )}
        </div>
      </section>
    </div>
  );
}
