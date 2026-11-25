"use client";

import { useState } from "react";
import { Check, ChevronDown, Gauge, X } from "lucide-react";
import { Card } from "@/components/ui";
import { scoreContent, type ScoreInput } from "@/lib/content-score";
import { cn } from "@/lib/utils";

export function ContentScoreCard({ input }: { input: ScoreInput }) {
  const [open, setOpen] = useState(false);
  const result = scoreContent(input);
  const color = result.score >= 85 ? "var(--ok)" : result.score >= 60 ? "var(--info)" : "var(--warn)";
  const missing = result.checks.filter((check) => !check.passed);

  return (
    <Card className="p-4 sm:p-5">
      <button type="button" className="flex w-full items-center gap-4 text-left" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${color} ${result.score * 3.6}deg, var(--surface-2) 0deg)` }}
          aria-hidden
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-sm font-bold tabular-nums">{result.score}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            <Gauge className="h-4 w-4 text-muted" aria-hidden />
            Quality score: {result.grade}
          </span>
          <span className="block text-sm text-muted">
            {missing.length ? `${missing.length} quick fix${missing.length === 1 ? "" : "es"} to improve reach` : "Everything is in place. Ready to publish."}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <ul className="mt-4 grid gap-2 border-t border-line pt-4">
          {result.checks.map((check) => (
            <li key={check.id} className="flex items-start gap-3 text-sm">
              <span
                className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", check.passed ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn")}
                aria-hidden
              >
                {check.passed ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span>
                <span className={cn("font-medium", check.passed && "text-muted")}>{check.label}</span>
                {!check.passed ? <span className="block text-[13px] leading-5 text-muted">{check.tip}</span> : null}
                <span className="sr-only">{check.passed ? "(passed)" : "(to fix)"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
