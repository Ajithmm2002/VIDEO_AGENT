"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const copiedWithFallback = document.execCommand("copy");
      area.remove();
      if (!copiedWithFallback) {
        toast.error("Could not copy. Select the text and copy it manually.");
        return;
      }
    }
    setCopied(true);
    toast.success("Copied");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="secondary" onClick={onCopy} disabled={!text}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
