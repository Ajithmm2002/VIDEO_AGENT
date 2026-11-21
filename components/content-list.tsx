"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ContentActions } from "@/components/content-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { LanguageBadge, PlatformBadge, StatusBadge } from "@/components/badges";
import { Card, EmptyState } from "@/components/ui";
import { deleteContents } from "@/lib/actions/content";
import type { Content } from "@/lib/types";
import { checklistProgress, formatDate } from "@/lib/utils";

function toggleId(current: Set<string>, id: string, on: boolean) {
  const next = new Set(current);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

export function ContentList({ contents }: { contents: Content[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ids = useMemo(() => contents.map((item) => item.id), [contents]);
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;
  const someSelected = selectedCount > 0 && !allSelected;

  if (!contents.length) {
    return (
      <Card>
        <EmptyState title="No matching content" body="Try another search, or create a new idea from this page." />
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) element.indeterminate = someSelected;
            }}
            onChange={(event) => setSelected(event.target.checked ? new Set(ids) : new Set())}
          />
          Select all
        </label>
        <ConfirmButton
          label={selectedCount ? `Delete selected (${selectedCount})` : "Delete selected"}
          title="Delete selected content?"
          message="This removes the selected items and their thumbnail files."
          confirmLabel="Delete selected"
          pendingLabel="Deleting…"
          disabled={!selectedCount}
          onConfirm={async () => {
            const result = await deleteContents([...selected].filter((id) => ids.includes(id)));
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(result.message ?? "Content deleted");
            setSelected(new Set());
            router.refresh();
          }}
        />
      </div>
      {contents.map((item) => {
        const on = selected.has(item.id);
        return (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4 hover:border-accent/35">
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1.5"
                checked={on}
                aria-label={`Select ${item.title}`}
                onChange={(event) => setSelected((current) => toggleId(current, item.id, event.target.checked))}
              />
              <div>
                <Link href={`/content/${item.id}`} className="font-semibold hover:text-accent">{item.title}</Link>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={item.status} />
                  <PlatformBadge platform={item.platform} />
                  <LanguageBadge language={item.language} />
                  {item.category ? <span className="text-xs text-muted">{item.category.name}</span> : null}
                  {item.is_template ? <span className="text-xs text-muted">Template</span> : null}
                  <span className="text-xs text-muted">{formatDate(item.planned_date)}</span>
                  {checklistProgress(item.checklist) ? <span className="text-xs text-muted">{checklistProgress(item.checklist)}</span> : null}
                </div>
              </div>
            </div>
            <ContentActions id={item.id} />
          </Card>
        );
      })}
    </div>
  );
}
