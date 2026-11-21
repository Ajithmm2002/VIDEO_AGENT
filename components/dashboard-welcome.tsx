"use client";

import type { ReactNode } from "react";
import { CalendarDays, ImageIcon, Sparkles } from "lucide-react";
import { AmbientGlow } from "@/components/ambient-glow";

const chips = [
  { icon: Sparkles, label: "Ideas" },
  { icon: ImageIcon, label: "Prompts" },
  { icon: CalendarDays, label: "Calendar" },
];

export function DashboardWelcome({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-line bg-surface/75 p-6 shadow-[var(--shadow)] sm:p-8">
      <AmbientGlow />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="animate-fade-up ig-text text-[11px] font-semibold uppercase tracking-[0.22em]">{eyebrow}</p>
          <h1 className="animate-fade-up mt-2 text-3xl font-semibold tracking-tight text-balance" style={{ animationDelay: "80ms" }}>
            {title}
          </h1>
          <p className="animate-fade-up mt-2 max-w-xl text-sm leading-6 text-muted" style={{ animationDelay: "160ms" }}>
            {description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip, index) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className="animate-float inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow)]"
                  style={{ animationDelay: `${index * 0.35}s` }}
                >
                  <span className="ig-gradient grid h-6 w-6 place-items-center rounded-full text-white">
                    <Icon className="h-3 w-3" />
                  </span>
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}
