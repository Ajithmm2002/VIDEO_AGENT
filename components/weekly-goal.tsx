"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flame, Minus, Pencil, Plus, Target } from "lucide-react";
import { setWeeklyGoal } from "@/lib/actions/creator";
import type { WeeklyProgress } from "@/lib/goals";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function WeeklyGoalCard({ progress, editable }: { progress: WeeklyProgress; editable: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(progress.goal);
  const [saving, setSaving] = useState(false);
  const percent = Math.min(100, Math.round((progress.thisWeek / progress.goal) * 100));
  const maxCount = Math.max(progress.goal, ...progress.weeks.map((week) => week.count), 1);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Target className="h-4 w-4 text-accent" aria-hidden />
          Weekly goal
        </h2>
        {editable && !editing ? (
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Change weekly goal"
            onClick={() => {
              setDraft(progress.goal);
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-muted">How many videos or posts do you want to publish each week?</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="min-w-10 px-0" aria-label="Fewer" onClick={() => setDraft((value) => Math.max(1, value - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-2xl font-semibold tabular-nums" aria-live="polite">
              {draft}
            </span>
            <Button variant="secondary" className="min-w-10 px-0" aria-label="More" onClick={() => setDraft((value) => Math.min(21, value + 1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true);
                const result = await setWeeklyGoal(draft);
                setSaving(false);
                if (!result.ok) return toast.error(result.error);
                toast.success(result.message ?? "Saved");
                setEditing(false);
                router.refresh();
              }}
            >
              Save goal
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
            {progress.thisWeek}
            <span className="text-lg font-medium text-muted"> / {progress.goal}</span>
          </p>
          <p className="text-sm text-muted">
            {progress.remaining === 0 ? "Goal reached this week. Nice work!" : `${progress.remaining} more to publish this week`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="This week's progress">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex items-end gap-1" aria-label="Published per week, last 8 weeks">
              {progress.weeks.map((week, index) => (
                <span
                  key={week.start}
                  title={`Week of ${week.start}: ${week.count}`}
                  className={cn("w-2.5 rounded-sm", week.met ? "bg-accent" : "bg-line-strong", index === progress.weeks.length - 1 && "ring-2 ring-accent/30")}
                  style={{ height: `${8 + (week.count / maxCount) * 28}px` }}
                />
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Flame className={cn("h-4 w-4", progress.streak ? "text-warn" : "text-muted")} aria-hidden />
              {progress.streak} week{progress.streak === 1 ? "" : "s"} streak
            </p>
          </div>
          <p className="mt-2 text-xs text-muted">Counts items marked Published, Monday to Sunday.</p>
        </>
      )}
    </Card>
  );
}
