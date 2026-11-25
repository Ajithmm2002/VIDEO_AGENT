/**
 * A quick, rule-based quality check for a content item. No AI: each check is a common
 * YouTube or Instagram best practice, and every failed check comes with one concrete fix.
 */

import type { Platform } from "@/lib/types";

export type ScoreInput = {
  title: string;
  topic: string | null;
  platform: Platform;
  description: string | null;
  youtube_description: string | null;
  instagram_caption: string | null;
  tags: string[];
  hashtags: string[];
  script_notes: string | null;
  thumbnail_prompt: string | null;
  has_thumbnail: boolean;
  planned_date: string | null;
};

export type ScoreCheck = { id: string; label: string; passed: boolean; weight: number; tip: string };

export type ContentScore = { score: number; grade: "Needs work" | "Good" | "Great"; checks: ScoreCheck[] };

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "my", "your", "how", "is", "are", "i"]);

function words(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function filled(value: string | null | undefined, min = 1) {
  return (value ?? "").trim().length >= min;
}

export function scoreContent(input: ScoreInput): ContentScore {
  const title = input.title.trim();
  const youtube = input.platform !== "instagram";
  const instagram = input.platform !== "youtube";
  const longText = [input.description, input.youtube_description].map((value) => (value ?? "").trim()).sort((a, b) => b.length - a.length)[0];
  const topicWords = words(input.topic ?? "");
  const titleWords = new Set(words(title));

  const checks: ScoreCheck[] = [
    {
      id: "title-length",
      label: "Title is 20–70 characters",
      passed: title.length >= 20 && title.length <= 70,
      weight: 15,
      tip: title.length < 20 ? "Make the title more specific; short titles get fewer clicks." : "Shorten the title so it is not cut off in search and feeds.",
    },
    {
      id: "title-keyword",
      label: "Title uses a word from the topic",
      passed: topicWords.length === 0 ? filled(input.topic) : topicWords.some((word) => titleWords.has(word)),
      weight: 10,
      tip: "Put the main topic word in the title so search can match it.",
    },
    {
      id: "description",
      label: youtube ? "Description has at least 150 characters" : "Description or notes written",
      passed: youtube ? (longText ?? "").length >= 150 : filled(longText, 40),
      weight: 15,
      tip: "Write 2–3 sentences about what viewers get, with the topic in the first line.",
    },
    {
      id: "caption",
      label: "Instagram caption written",
      passed: !instagram || filled(input.instagram_caption, 30),
      weight: instagram ? 10 : 0,
      tip: "Add a caption with a hook line, a short story, and a call to action.",
    },
    {
      id: "tags",
      label: "5 or more YouTube tags",
      passed: !youtube || input.tags.length >= 5,
      weight: youtube ? 10 : 0,
      tip: "Add 5–15 tags: the main topic, variations, and your channel name.",
    },
    {
      id: "hashtags",
      label: instagram ? "5–30 hashtags" : "3–15 hashtags",
      passed: instagram ? input.hashtags.length >= 5 && input.hashtags.length <= 30 : input.hashtags.length >= 3 && input.hashtags.length <= 15,
      weight: 10,
      tip: instagram ? "Use 5–30 hashtags, mixing broad and niche ones." : "Use 3–15 hashtags; YouTube ignores all of them if there are too many.",
    },
    {
      id: "script",
      label: "Script or shot notes added",
      passed: filled(input.script_notes, 40),
      weight: 10,
      tip: "Note the hook, the main points, and the ending before you record.",
    },
    {
      id: "thumbnail",
      label: "Thumbnail ready",
      passed: input.has_thumbnail || filled(input.thumbnail_prompt, 20),
      weight: 10,
      tip: "Upload a thumbnail or write a prompt on the Thumbnails page.",
    },
    {
      id: "date",
      label: "Publishing date set",
      passed: Boolean(input.planned_date),
      weight: 10,
      tip: "Pick a date so it shows on your calendar and weekly goal.",
    },
  ].filter((check) => check.weight > 0);

  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const score = total ? Math.round((earned / total) * 100) : 0;
  return { score, grade: score >= 85 ? "Great" : score >= 60 ? "Good" : "Needs work", checks };
}
