"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, Field } from "@/components/ui";

async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea path.
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copiedWithFallback = document.execCommand("copy");
  area.remove();
  return copiedWithFallback;
}

export function CopyButton({
  text,
  label = "Copy",
  compact = false,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  async function onCopy() {
    if (!text.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    setCopying(true);
    try {
      const ok = await writeClipboard(text);
      if (!ok) {
        toast.error("Could not copy. Select the text and copy it manually.");
        return;
      }
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 1500);
    } finally {
      setCopying(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={onCopy}
        disabled={!text.trim() || copying}
        aria-label={copied ? "Copied" : label}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <Button variant="secondary" onClick={onCopy} loading={copying} disabled={!text.trim() || copying}>
      {copied ? <Check className="h-4 w-4" /> : copying ? null : <Copy className="h-4 w-4" />}
      {copying ? "Copying…" : copied ? "Copied" : label}
    </Button>
  );
}

export function CopyField({
  label,
  hint,
  text,
  children,
}: {
  label: string;
  hint?: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <Field label={label} hint={hint} action={<CopyButton compact text={text} label={`Copy ${label}`} />}>
      {children}
    </Field>
  );
}
