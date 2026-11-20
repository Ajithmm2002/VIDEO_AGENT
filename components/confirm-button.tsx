"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </Button>
      <dialog
        ref={dialogRef}
        className="w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-5 text-ink"
        onClose={() => setOpen(false)}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
