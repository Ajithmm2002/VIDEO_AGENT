"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Shuffle } from "lucide-react";
import { createShareLink, repurposeContent, revokeShareLink } from "@/lib/actions/content";
import { CopyButton } from "@/components/copy-button";
import { Button, Card } from "@/components/ui";

export function ReviewLinkCard({ contentId, token, origin }: { contentId: string; token: string | null; origin: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(token);
  const [busy, setBusy] = useState(false);
  const url = current ? `${origin}/share/${current}` : "";

  return (
    <Card className="grid gap-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Link2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">Share for review</h2>
          <p className="mt-0.5 text-sm leading-6 text-muted">
            Send a read-only link to a client, editor, or brand. They see the title, captions, tags, and script, without an account. Notes and links stay private.
          </p>
        </div>
      </div>
      {current ? (
        <>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface-2 p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
            <CopyButton text={url} label="Copy review link" compact />
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-accent hover:bg-surface-2">
              Open preview
            </a>
            <Button
              variant="ghost"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const result = await revokeShareLink(contentId);
                setBusy(false);
                if (!result.ok) return toast.error(result.error);
                setCurrent(null);
                toast.success(result.message ?? "Turned off");
                router.refresh();
              }}
            >
              Stop sharing
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="secondary"
          className="w-fit"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const result = await createShareLink(contentId);
            setBusy(false);
            if (!result.ok) return toast.error(result.error);
            setCurrent(result.token ?? null);
            toast.success(result.message ?? "Link ready");
            router.refresh();
          }}
        >
          Create review link
        </Button>
      )}
    </Card>
  );
}

export function RepurposeButton({ contentId, disabled }: { contentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      disabled={disabled}
      title="Create a Short, a Reel, and a carousel post from this idea"
      onClick={async () => {
        setBusy(true);
        const result = await repurposeContent(contentId);
        setBusy(false);
        if (!result.ok) return toast.error(result.error);
        toast.success(`${result.message ?? "Created"} Find the Short, Reel, and carousel in Content.`);
        router.refresh();
      }}
    >
      {busy ? null : <Shuffle className="h-4 w-4" aria-hidden />}
      {busy ? "Repurposing…" : "Repurpose"}
    </Button>
  );
}
