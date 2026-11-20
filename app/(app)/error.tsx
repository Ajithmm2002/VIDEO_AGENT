"use client";

import { Button } from "@/components/ui";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/85 p-6 shadow-[var(--shadow)]">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Refresh the page or try the action again.</p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
