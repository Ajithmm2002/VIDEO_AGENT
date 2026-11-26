/** "About my channel": private details that make AI ideas fit the creator's niche. */

import { platforms, type Platform } from "@/lib/types";

export const channelLanguages = ["en", "ml", "both"] as const;
export type ChannelLanguage = (typeof channelLanguages)[number];

export const channelStyles = ["Funny", "Informative", "Emotional", "Cinematic", "Casual", "Inspiring"] as const;
export type ChannelStyle = (typeof channelStyles)[number];

export type ChannelProfile = {
  channel_name: string;
  niche: string;
  audience: string;
  language: ChannelLanguage;
  platform: Platform;
  styles: ChannelStyle[];
  about: string;
};

export const CHANNEL_ABOUT_MAX = 600;

export function emptyChannel(): ChannelProfile {
  return { channel_name: "", niche: "", audience: "", language: "en", platform: "both", styles: [], about: "" };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function asChannel(value: unknown): ChannelProfile {
  const row = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const language = (channelLanguages as readonly string[]).includes(String(row.language)) ? (row.language as ChannelLanguage) : "en";
  const platform = (platforms as readonly string[]).includes(String(row.platform)) ? (row.platform as Platform) : "both";
  const styles = Array.isArray(row.styles)
    ? row.styles.filter((style): style is ChannelStyle => (channelStyles as readonly string[]).includes(String(style))).slice(0, 3)
    : [];
  return {
    channel_name: text(row.channel_name, 80),
    niche: text(row.niche, 80),
    audience: text(row.audience, 160),
    language,
    platform,
    styles,
    about: text(row.about, CHANNEL_ABOUT_MAX),
  };
}

/** Enough detail for the AI to tailor ideas. */
export function channelIsSetUp(channel: ChannelProfile | null | undefined) {
  return Boolean(channel && (channel.niche || channel.about));
}

export function channelSummary(channel: ChannelProfile) {
  const language = channel.language === "ml" ? "Malayalam" : channel.language === "both" ? "Malayalam and English" : "English";
  return [channel.niche, language, channel.styles.join(", ")].filter(Boolean).join(" · ");
}
