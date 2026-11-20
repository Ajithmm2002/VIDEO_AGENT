"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteContent, duplicateContent } from "@/lib/actions/content";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui";

export function ContentActions({ id }: { id: string }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        loading={duplicating}
        onClick={async () => {
          setDuplicating(true);
          try {
            const result = await duplicateContent(id);
            if (!result.ok || !result.id) {
              toast.error(result.ok ? "Could not duplicate." : result.error);
              return;
            }
            toast.success("Copy created");
            router.push(`/content/${result.id}`);
          } finally {
            setDuplicating(false);
          }
        }}
      >
        {duplicating ? "Duplicating…" : "Duplicate"}
      </Button>
      <ConfirmButton
        label="Delete"
        title="Delete this content?"
        message="This removes the content item and its thumbnail file."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        onConfirm={async () => {
          const result = await deleteContent(id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Content deleted");
          router.refresh();
        }}
      />
    </div>
  );
}
