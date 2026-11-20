import type { Language, Platform, Status } from "@/lib/types";
import { languageLabels, platformLabels, statusColors, statusLabels } from "@/lib/labels";

export function StatusBadge({ status }: { status: Status }) {
  const color = statusColors[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {statusLabels[status]}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
      {platformLabels[platform]}
    </span>
  );
}

export function LanguageBadge({ language }: { language: Language }) {
  return (
    <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
      {languageLabels[language]}
    </span>
  );
}
