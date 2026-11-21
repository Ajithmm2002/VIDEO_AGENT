"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel,
  pendingLabel = "Working…",
  onConfirm,
  disabled,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const messageId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, pending]);

  const close = () => {
    if (!pending) setOpen(false);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} disabled={disabled || pending} loading={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {mounted && open
        ? createPortal(
            <div className="animate-veil-in fixed inset-0 z-[100] grid place-items-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-[#12040c]/62 backdrop-blur-md"
                aria-label="Close dialog"
                onClick={close}
              />
              <div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                tabIndex={-1}
                className="animate-pop-in relative z-10 w-[min(26rem,100%)] rounded-[1.75rem] border border-line bg-surface p-6 shadow-[var(--shadow)] outline-none"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/12 text-danger shadow-[var(--shadow-inset)]">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <h2 id={titleId} className="mt-4 text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                <p id={messageId} className="mt-2 text-sm leading-6 text-muted">
                  {message}
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={close} disabled={pending}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    loading={pending}
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
                    {pending ? pendingLabel : confirmLabel}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
