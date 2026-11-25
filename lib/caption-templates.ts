/**
 * Proven hook, caption, and call-to-action patterns. {topic} is replaced with the creator's
 * topic; other {placeholders} stay visible so the creator fills them in.
 */

export type TemplateKind = "hook" | "caption" | "cta" | "title";

export type CaptionTemplate = { id: string; kind: TemplateKind; label: string; text: string };

export const TEMPLATE_KINDS: Array<{ id: TemplateKind; label: string; hint: string }> = [
  { id: "hook", label: "Hooks", hint: "First 2 seconds of a video" },
  { id: "title", label: "Titles", hint: "YouTube titles and reel covers" },
  { id: "caption", label: "Captions", hint: "Instagram and description structures" },
  { id: "cta", label: "Calls to action", hint: "The ask at the end" },
];

export const CAPTION_TEMPLATES: CaptionTemplate[] = [
  { id: "hook-mistake", kind: "hook", label: "Mistake", text: "Stop making this {topic} mistake." },
  { id: "hook-nobody", kind: "hook", label: "Nobody tells you", text: "Nobody tells you this about {topic}." },
  { id: "hook-tried", kind: "hook", label: "I tried it", text: "I tried {topic} for 7 days. Here is what happened." },
  { id: "hook-wish", kind: "hook", label: "Wish I knew", text: "I wish I knew this about {topic} sooner." },
  { id: "hook-seconds", kind: "hook", label: "In seconds", text: "{topic}, explained in 30 seconds." },
  { id: "hook-wrong", kind: "hook", label: "Doing it wrong", text: "You are probably doing {topic} wrong. Watch till the end." },
  { id: "hook-budget", kind: "hook", label: "Budget", text: "{topic} on a budget: under ₹{amount}." },
  { id: "hook-pov", kind: "hook", label: "POV", text: "POV: it is your first time trying {topic}." },
  { id: "hook-question", kind: "hook", label: "Question", text: "Have you ever wondered why {topic}?" },
  { id: "hook-ranking", kind: "hook", label: "Ranking", text: "Ranking every {topic} from worst to best." },
  { id: "hook-before-after", kind: "hook", label: "Before and after", text: "Before vs after {topic}. Wait for it." },
  { id: "hook-save", kind: "hook", label: "Save this", text: "Save this before you try {topic}." },

  { id: "title-how", kind: "title", label: "How to", text: "How to {topic} (step by step for beginners)" },
  { id: "title-number", kind: "title", label: "Numbered list", text: "{number} {topic} tips that actually work" },
  { id: "title-vs", kind: "title", label: "Versus", text: "{topic} vs {other}: which one is better?" },
  { id: "title-challenge", kind: "title", label: "Challenge", text: "I tried {topic} for 30 days" },
  { id: "title-honest", kind: "title", label: "Honest review", text: "Honest {topic} review after {time} of use" },
  { id: "title-guide", kind: "title", label: "Complete guide", text: "The complete {topic} guide ({year})" },
  { id: "title-mistakes", kind: "title", label: "Mistakes", text: "{number} {topic} mistakes to avoid" },
  { id: "title-local", kind: "title", label: "Local angle", text: "{topic} in Kerala: what you need to know" },

  {
    id: "caption-story",
    kind: "caption",
    label: "Hook, story, lesson",
    text: "{hook line}\n\nHere is what happened when I tried {topic}: {one or two lines}.\n\nThe lesson: {takeaway}.\n\n{call to action}",
  },
  {
    id: "caption-list",
    kind: "caption",
    label: "Quick list",
    text: "{number} things I learned about {topic}:\n\n1. {point}\n2. {point}\n3. {point}\n\nWhich one surprised you? 👇",
  },
  {
    id: "caption-problem",
    kind: "caption",
    label: "Problem, fix, result",
    text: "Struggling with {topic}?\n\nThe problem: {problem}.\nThe fix: {fix}.\nThe result: {result}.\n\nSave this for later.",
  },
  {
    id: "caption-yt-description",
    kind: "caption",
    label: "YouTube description",
    text: "In this video: {topic}, explained step by step.\n\n⏱️ Chapters\n00:00 Intro\n{time} {chapter}\n{time} {chapter}\n\n🔗 Links mentioned\n{links}\n\nIf this helped, subscribe for more videos on {topic}.",
  },
  {
    id: "caption-recipe",
    kind: "caption",
    label: "Recipe",
    text: "{dish name} 🍽️\n\nYou need:\n- {ingredient}\n- {ingredient}\n- {ingredient}\n\nSteps:\n1. {step}\n2. {step}\n3. {step}\n\nTry it and tag me!",
  },
  {
    id: "caption-affiliate",
    kind: "caption",
    label: "Product post",
    text: "I have been using {product} for {time}, and here is my honest take on it for {topic}.\n\n👍 {good point}\n👎 {bad point}\n\nLink in bio. (Affiliate link: I may earn a small commission at no extra cost to you.)",
  },

  { id: "cta-follow", kind: "cta", label: "Follow", text: "Follow for more {topic} tips every week." },
  { id: "cta-comment", kind: "cta", label: "Comment", text: "Comment \"{keyword}\" and I will reply with the full list." },
  { id: "cta-save", kind: "cta", label: "Save", text: "Save this so you have it when you need it." },
  { id: "cta-share", kind: "cta", label: "Share", text: "Send this to a friend who needs to see it." },
  { id: "cta-part2", kind: "cta", label: "Part 2", text: "Want part 2? Let me know in the comments." },
  { id: "cta-subscribe", kind: "cta", label: "Subscribe", text: "Subscribe so you do not miss the next video on {topic}." },
  { id: "cta-question", kind: "cta", label: "Question", text: "What would you add? Tell me below 👇" },
  { id: "cta-link", kind: "cta", label: "Link in bio", text: "Everything I used is linked in my bio." },
];

export function fillTemplate(text: string, topic: string) {
  const value = topic.trim();
  return value ? text.replaceAll("{topic}", value) : text;
}
