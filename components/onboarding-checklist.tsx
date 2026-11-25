"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { dismissOnboarding } from "@/lib/actions/creator";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type OnboardingStep = { id: string; label: string; hint: string; href: string; done: boolean };

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const done = steps.filter((step) => step.done).length;
  if (hidden) return null;

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Get started</h2>
          <p className="mt-1 text-sm text-muted">
            {done} of {steps.length} done. Each step takes a minute or two.
          </p>
        </div>
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Hide the getting started checklist"
          onClick={async () => {
            setHidden(true);
            const result = await dismissOnboarding();
            if (!result.ok) {
              setHidden(false);
              toast.error(result.error);
              return;
            }
            router.refresh();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex h-full items-start gap-3 rounded-xl border p-3 hover:bg-surface-2",
                step.done ? "border-line bg-surface-2/50" : "border-line",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  step.done ? "border-ok bg-ok text-accent-ink" : "border-line-strong",
                )}
                aria-hidden
              >
                {step.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium", step.done && "text-muted line-through")}>{step.label}</span>
                <span className="block text-xs leading-5 text-muted">{step.hint}</span>
              </span>
              <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
