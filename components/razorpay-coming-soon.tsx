"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { formatSkillPrice } from "@/lib/marketplace-file";

export function RazorpayComingSoon({
  title,
  amountPaise,
  compact = false,
  disabled = false,
  note,
  label,
}: {
  title: string;
  amountPaise: number;
  compact?: boolean;
  disabled?: boolean;
  note?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const messageId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && mounted) setOpening(false);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <Button
        loading={opening}
        disabled={disabled || opening}
        className={compact ? "h-8 w-full px-2.5 py-1 text-xs" : "w-full"}
        onClick={() => {
          setOpening(true);
          setOpen(true);
        }}
      >
        {opening ? "Opening…" : label ?? "Buy now"}
      </Button>
      {mounted && open
        ? createPortal(
            <div className="animate-veil-in fixed inset-0 z-[100] grid place-items-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-[#12040c]/62 backdrop-blur-md"
                aria-label="Close Razorpay dialog"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                tabIndex={-1}
                className="animate-pop-in relative z-10 w-[min(26rem,100%)] rounded-[1.75rem] border border-line bg-surface p-6 shadow-[var(--shadow)] outline-none"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b72e7]">Razorpay</p>
                <h2 id={titleId} className="mt-3 text-lg font-semibold tracking-tight">
                  Pay {formatSkillPrice(amountPaise)} for {title}
                </h2>
                <p id={messageId} className="mt-2 text-sm leading-6 text-muted">
                  {note ??
                    "Razorpay checkout is coming soon. Card, UPI, and net banking pay the listed rupee price. You can also redeem studio coins for this skill. Coins are not converted into cash or gift cards."}
                </p>
                <div className="mt-5 rounded-2xl border border-dashed border-line bg-surface-2/80 px-4 py-3 text-sm text-muted shadow-[var(--shadow-inset)]">
                  Secure payment by Razorpay · Coming soon
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Button disabled>Continue with Razorpay</Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
