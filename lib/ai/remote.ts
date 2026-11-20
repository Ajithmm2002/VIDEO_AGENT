import type { Language, Platform } from "@/lib/types";
import {
  localThumbnail,
  toEnglishHashtags,
  toEnglishTags,
  type ThumbnailDraft,
  type TopicCopy,
  type WritingDraft,
} from "@/lib/ai/local";

type RemoteThumbnail = Omit<ThumbnailDraft, "provider"> & { provider: "remote" };
type RemoteWriting = Omit<WritingDraft, "provider"> & { provider: "remote" };

const geminiModels = ["gemini-3.5-flash", "gemini-flash-lite-latest"];

function endpoint() {
  if (process.env.AI_BASE_URL) return process.env.AI_BASE_URL.replace(/\/$/, "");
  return "https://api.openai.com/v1";
}

function model() {
  return process.env.AI_MODEL || "gpt-4o-mini";
}

function geminiModelOrder() {
  const preferred = process.env.AI_MODEL?.trim();
  return [...new Set([preferred, ...geminiModels].filter((name): name is string => Boolean(name)))];
}

function readGeminiText(payload: unknown) {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => part.text && !part.thought)
    .map((part) => part.text)
    .join("")
    .trim();
}

async function geminiComplete(system: string, user: string) {
  let sawBusy = false;
  for (const modelName of geminiModelOrder()) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.AI_API_KEY ?? "",
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(50000),
        },
      );
    } catch {
      sawBusy = true;
      continue;
    }

    if (response.status === 429 || response.status === 503) {
      sawBusy = true;
      continue;
    }
    if (!response.ok) continue;

    const text = readGeminiText(await response.json());
    if (!text) continue;
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      continue;
    }
  }

  throw new Error(
    sawBusy
      ? "Gemini is busy right now. Try again in a moment."
      : "Gemini could not complete that request.",
  );
}

async function complete(system: string, user: string) {
  if (process.env.AI_PROVIDER === "gemini" && !process.env.AI_BASE_URL) {
    return geminiComplete(system, user);
  }

  const response = await fetch(`${endpoint()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model(),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error("The connected AI provider rejected the request.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The connected AI provider returned an empty response.");
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export async function remoteThumbnail(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
}): Promise<RemoteThumbnail> {
  const fallback = localThumbnail(input);
  const data = await complete(
    "You write image-generation prompts for Google Flow. Reply with JSON only: {\"landscape\": string, \"vertical\": string}. Landscape is 16:9 YouTube. Vertical is 9:16 Reels or Shorts. Each prompt must include subject, background, lighting, composition, colours, text placement, and visual style. Write the instructions in English. If the topic is Malayalam, quote the Malayalam text exactly as the words to render. Do not describe an image you generated.",
    `Topic: ${input.topic}\nLanguage: ${input.language}\nStyle notes: ${input.styleNotes || "none"}`,
  );
  const landscape = typeof data.landscape === "string" ? data.landscape.trim() : "";
  const vertical = typeof data.vertical === "string" ? data.vertical.trim() : "";
  if (!landscape || !vertical) {
    throw new Error("The connected AI provider returned an incomplete prompt.");
  }
  return {
    landscape,
    vertical,
    language: fallback.language,
    provider: "remote",
  };
}

const copySystem = `You write YouTube and Instagram copy for one creator. First understand the specific video idea from the title, topic, and notes. Do not write generic filler.

Reply with JSON only.

Rules:
- titles, hook, scriptOutline, description, youtubeDescription, instagramCaption: write in the requested language (Malayalam or English). Match the actual idea.
- Use relevant emojis in descriptions and captions. One emoji at the start of a hook or bullet is enough. Do not spam emojis.
- YouTube description: hook, then 4-6 specific bullets about THIS topic, then a comment CTA.
- Instagram caption: 3-5 short lines with emojis, then a question.
- tags: YouTube SEO tags in ENGLISH only. ASCII letters, numbers, and spaces. No #. No Malayalam script. Mix short tags and long-tail phrases from the idea.
- hashtags: ENGLISH only. Start with #. CamelCase or one word. No spaces. No Malayalam script. Include topic-specific tags. If the idea is Malayalam, also include #Malayalam and #Kerala.
- Return exactly the requested tag and hashtag counts.
- Keep the script as a short outline, not a full filmed script.`;

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export async function remoteWriting(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
  tagCount?: number;
  hashtagCount?: number;
  title?: string;
  notes?: string;
}): Promise<RemoteWriting> {
  const tagCount = input.tagCount ?? 12;
  const hashtagCount = input.hashtagCount ?? 15;
  const data = await complete(
    `${copySystem} JSON shape: {"titles": string[3], "youtubeDescription": string, "instagramCaption": string, "tags": string[], "hashtags": string[], "hook": string, "scriptOutline": string}.`,
    `Title: ${input.title || "(none)"}\nTopic: ${input.topic}\nNotes: ${input.notes || "(none)"}\nLanguage: ${input.language}\nPlatform: ${input.platform}\nTone: ${input.tone || "clear and specific"}\nYouTube SEO tags wanted: ${tagCount}\nHashtags wanted: ${hashtagCount}`,
  );
  const titles = Array.isArray(data.titles) ? data.titles.filter((item) => typeof item === "string") : [];
  if (titles.length < 1 || typeof data.youtubeDescription !== "string" || typeof data.hook !== "string") {
    throw new Error("The connected AI provider returned an incomplete draft.");
  }
  return {
    titles: titles.slice(0, 3),
    youtubeDescription: data.youtubeDescription,
    instagramCaption: typeof data.instagramCaption === "string" ? data.instagramCaption : "",
    tags: toEnglishTags(stringList(data.tags), tagCount),
    hashtags: toEnglishHashtags(stringList(data.hashtags), hashtagCount),
    hook: data.hook,
    scriptOutline: typeof data.scriptOutline === "string" ? data.scriptOutline : "",
    provider: "remote",
  };
}

export async function remoteTopicCopy(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tagCount: number;
  hashtagCount: number;
  title?: string;
  notes?: string;
}): Promise<TopicCopy> {
  const data = await complete(
    `${copySystem} JSON shape: {"description": string, "youtubeDescription": string, "instagramCaption": string, "tags": string[], "hashtags": string[]}.`,
    `Title: ${input.title || "(none)"}\nTopic: ${input.topic}\nNotes: ${input.notes || "(none)"}\nLanguage: ${input.language}\nPlatform: ${input.platform}\nYouTube SEO tags wanted: ${input.tagCount}\nHashtags wanted: ${input.hashtagCount}`,
  );
  const youtubeDescription = typeof data.youtubeDescription === "string" ? data.youtubeDescription.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : youtubeDescription;
  if (!youtubeDescription && !description) {
    throw new Error("The connected AI provider returned an incomplete draft.");
  }
  return {
    description: description || youtubeDescription,
    youtubeDescription: youtubeDescription || description,
    instagramCaption: typeof data.instagramCaption === "string" ? data.instagramCaption.trim() : "",
    tags: toEnglishTags(stringList(data.tags), input.tagCount),
    hashtags: toEnglishHashtags(stringList(data.hashtags), input.hashtagCount),
    provider: "remote",
  };
}
