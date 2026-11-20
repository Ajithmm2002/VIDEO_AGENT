"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePlannedDate } from "@/lib/actions/content";
import { StatusBadge } from "@/components/badges";
import { TextInput } from "@/components/ui";
import type { Content } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <div className={cn("grid gap-4", pending && "opacity-70")}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="hidden px-2 text-xs font-medium text-muted sm:block">{label}</div>
        ))}
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
                "min-h-32 rounded-3xl border bg-surface/80 p-2.5 shadow-[var(--shadow)]",
                day === today ? "border-accent ring-2 ring-accent/20" : "border-line/80",
                dragOver === day && "border-accent bg-accent/10",
                muted && "opacity-55",
              )}
            >
              <div className={cn("mb-2 text-xs font-semibold", day === today && "text-accent")}>{Number(day.slice(8))}</div>
              <div className="grid gap-1">
                {items.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                    className="cursor-grab rounded-2xl bg-surface-2 p-2 text-xs active:cursor-grabbing"
                  >
                    <Link href={`/content/${item.id}`} className="font-medium">{item.title}</Link>
                    <div className="mt-1"><StatusBadge status={item.status} /></div>
                    <TextInput
                      type="date"
                      aria-label={`Move ${item.title}`}
                      className="mt-2 h-8 text-xs"
                      value={item.planned_date ?? ""}
                      onChange={(event) => move(item.id, event.target.value || null)}
                    />
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-3xl border border-line/80 bg-surface/85 p-5 shadow-[var(--shadow)]">
        <h2 className="font-semibold">No date yet</h2>
        <p className="mb-4 text-sm leading-6 text-muted">Drag a card onto a day, or pick a date. This list shows content that has no publishing date.</p>
        <div className="grid gap-2 md:grid-cols-2">
          {undated.length ? undated.map((item) => (
            <article
              key={item.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
              className="cursor-grab rounded-2xl border border-line bg-surface-2/50 p-3 text-sm active:cursor-grabbing"
            >
              <Link href={`/content/${item.id}`} className="font-medium">{item.title}</Link>
              <TextInput
                type="date"
                aria-label={`Schedule ${item.title}`}
                className="mt-2"
                onChange={(event) => {
                  if (event.target.value) move(item.id, event.target.value);
                }}
              />
            </article>
          )) : <p className="text-sm text-muted">No undated content in this filter.</p>}
        </div>
      </section>
    </div>
  );
}
