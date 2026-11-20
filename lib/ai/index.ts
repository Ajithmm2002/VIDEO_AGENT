import type { Language, Platform } from "@/lib/types";
import { remoteAiEnabled } from "@/lib/env";
import { localThumbnail, localWriting, type ThumbnailDraft, type WritingDraft } from "@/lib/ai/local";
import { remoteThumbnail, remoteWriting } from "@/lib/ai/remote";

export type ThumbnailResult = Omit<ThumbnailDraft, "provider"> & { provider: "local" | "remote" };
export type WritingResult = Omit<WritingDraft, "provider"> & { provider: "local" | "remote" };

export async function generateThumbnailPrompts(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
}): Promise<ThumbnailResult> {
  if (!remoteAiEnabled()) return localThumbnail(input);
  return remoteThumbnail(input);
}

export async function generateWritingDraft(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
}): Promise<WritingResult> {
  if (!remoteAiEnabled()) return localWriting(input);
  return remoteWriting(input);
}
