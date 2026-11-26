/**
 * Festival content ideas tailored to a creator's channel. The remote model writes them when
 * one is connected; this file holds the shared types and the no-AI fallback.
 */

import type { ChannelProfile } from "@/lib/channel-profile";
import type { Festival } from "@/lib/festivals";

export type FestivalIdeaDraft = {
  title: string;
  hook: string;
  outline: string;
  caption: string;
  hashtags: string[];
};

export type FestivalIdeasResult = { provider: "local" | "remote"; ideas: FestivalIdeaDraft[] };

export const FESTIVAL_IDEA_COUNT = 4;

function tag(value: string) {
  const clean = value.replace(/[^\p{L}\p{N}]+/gu, "");
  return clean ? `#${clean.toLowerCase()}` : "";
}

function uniqueTags(values: string[], count = 10) {
  return [...new Set(values.map(tag).filter(Boolean))].slice(0, count);
}

/** Without AI: the festival's starter ideas, plus angles that put the creator's niche first. */
export function localFestivalIdeas(festival: Festival, channel: ChannelProfile | null): FestivalIdeasResult {
  const niche = channel?.niche.trim() || "";
  const hashtags = uniqueTags([festival.name, niche, festival.region === "Kerala" ? "Kerala" : "India", "reels", "youtubeshorts", ...niche.split(/\s+/)]);
  const nicheIdeas: FestivalIdeaDraft[] = niche
    ? [
        {
          title: `${festival.name} special: ${niche} edition`,
          hook: `Your ${festival.name} plans are missing this ${niche.toLowerCase()} idea.`,
          outline: `Open with the finished result. Show 3 quick steps that tie ${niche.toLowerCase()} to ${festival.name}. End with a question for viewers.`,
          caption: `${festival.name}, but make it ${niche.toLowerCase()}. Would you try this? 👇`,
          hashtags,
        },
        {
          title: `5 ${niche} ideas for ${festival.name}`,
          hook: `Five ${festival.name} ideas in under a minute. Save this.`,
          outline: "One idea per scene, 8–10 seconds each, with the idea written on screen. Last scene: your favourite of the five.",
          caption: `Saving these for ${festival.name}. Which one is your pick?`,
          hashtags,
        },
      ]
    : [];
  const starters = festival.ideas.map((idea) => ({
    title: idea.title,
    hook: `${festival.name} is coming. ${idea.title}.`,
    outline: idea.howTo,
    caption: `${idea.title} ✨ Tag someone who celebrates ${festival.name} with you.`,
    hashtags,
  }));
  return { provider: "local", ideas: [...nicheIdeas, ...starters].slice(0, FESTIVAL_IDEA_COUNT) };
}

/** Accept only complete ideas from the model, with English hashtags. */
export function cleanFestivalIdeas(raw: unknown): FestivalIdeaDraft[] {
  // Models sometimes return a bare list, or use "items", or give lines as arrays; accept all of them.
  const container = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const items: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray(container?.ideas)
      ? (container.ideas as unknown[])
      : Array.isArray(container?.items)
        ? (container.items as unknown[])
        : [];
  return items
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const field = (key: string, max: number) => {
        const value = row[key];
        if (typeof value === "string") return value.trim().slice(0, max);
        if (Array.isArray(value)) return value.filter((line): line is string => typeof line === "string").map((line) => line.trim()).filter(Boolean).join("\n").slice(0, max);
        return "";
      };
      const title = field("title", 100);
      const hook = field("hook", 300);
      const outline = field("outline", 1500);
      const caption = field("caption", 1500);
      if (!title || !outline) return [];
      const hashtags = Array.isArray(row.hashtags)
        ? [...new Set(row.hashtags.filter((value): value is string => typeof value === "string").map((value) => `#${value.replace(/^#/, "").replace(/[^A-Za-z0-9_]/g, "")}`).filter((value) => value.length > 2))].slice(0, 15)
        : [];
      return [{ title, hook, outline, caption, hashtags }];
    })
    .slice(0, FESTIVAL_IDEA_COUNT);
}
