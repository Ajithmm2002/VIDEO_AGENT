import type { ContentPlan, Language, PlanHorizon, Platform } from "@/lib/types";
import { remoteAiEnabled } from "@/lib/env";
import {
  localContentPlan,
  localThumbnail,
  localTopicCopy,
  localWriting,
  toEnglishHashtags,
  toEnglishTags,
  type ThumbnailDraft,
  type TopicCopy,
  type WritingDraft,
} from "@/lib/ai/local";
import { remoteContentPlan, remoteThumbnail, remoteTopicCopy, remoteWriting } from "@/lib/ai/remote";
import { planItemCount, spreadPlanDates } from "@/lib/utils";

export type ThumbnailResult = Omit<ThumbnailDraft, "provider"> & { provider: "local" | "remote" };
export type WritingResult = Omit<WritingDraft, "provider"> & { provider: "local" | "remote" };
export type TopicCopyResult = TopicCopy;

export async function generateThumbnailPrompts(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
  landscape?: boolean;
  vertical?: boolean;
}): Promise<ThumbnailResult> {
  if (!remoteAiEnabled()) return localThumbnail(input);
  try {
    return await remoteThumbnail(input);
  } catch {
    return localThumbnail(input);
  }
}

function mergeLimited(primary: string[], fallback: string[], count: number) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of [...primary, ...fallback]) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= count) break;
  }
  return result;
}

export async function generateWritingDraft(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
  tagCount?: number;
  hashtagCount?: number;
  title?: string;
  notes?: string;
}): Promise<WritingResult> {
  const local = localWriting(input);
  const tagCount = input.tagCount ?? 12;
  const hashtagCount = input.hashtagCount ?? 15;
  if (!remoteAiEnabled()) return local;
  try {
    const result = await remoteWriting(input);
    return {
      ...result,
      tags: toEnglishTags(mergeLimited(result.tags, local.tags, tagCount), tagCount),
      hashtags: toEnglishHashtags(mergeLimited(result.hashtags, local.hashtags, hashtagCount), hashtagCount),
    };
  } catch {
    return local;
  }
}

export async function generateTopicCopy(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tagCount: number;
  hashtagCount: number;
  title?: string;
  notes?: string;
}): Promise<TopicCopyResult> {
  const local = localTopicCopy(input);
  if (!remoteAiEnabled()) return local;
  try {
    const result = await remoteTopicCopy(input);
    return {
      ...result,
      description: result.description || local.description,
      youtubeDescription: result.youtubeDescription || local.youtubeDescription,
      instagramCaption: result.instagramCaption || local.instagramCaption,
      tags: toEnglishTags(mergeLimited(result.tags, local.tags, input.tagCount), input.tagCount),
      hashtags: toEnglishHashtags(mergeLimited(result.hashtags, local.hashtags, input.hashtagCount), input.hashtagCount),
    };
  } catch {
    return local;
  }
}

export async function generateContentPlan(input: {
  language: Language;
  platform: Platform;
  themes: string[];
  description: string;
  horizon: PlanHorizon;
  startDate: string;
}): Promise<ContentPlan> {
  const count = planItemCount(input.horizon);
  const dates = spreadPlanDates(input.startDate, input.horizon, count);
  const local = localContentPlan({ ...input, count });
  let items = local.items;
  let provider: "local" | "remote" = "local";
  if (remoteAiEnabled()) {
    try {
      const remote = await remoteContentPlan({ ...input, count });
      const merged = [...remote.items];
      if (merged.length < count) {
        for (const extra of local.items) {
          if (merged.length >= count) break;
          if (merged.some((item) => item.title.toLowerCase() === extra.title.toLowerCase())) continue;
          merged.push(extra);
        }
      }
      items = merged.slice(0, count);
      provider = "remote";
    } catch {
      items = local.items;
    }
  }
  return {
    provider,
    items: items.map((item, index) => ({
      ...item,
      planned_date: dates[index] ?? dates[dates.length - 1],
    })),
  };
}
