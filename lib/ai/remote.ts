import type { ContentPlan, Language, Platform, VideoDuration } from "@/lib/types";
import { spokenWordTarget } from "@/lib/utils";
import { localAudioScript } from "@/lib/ai/local";
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

export const geminiFallbackModels = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];

export const geminiLiteModels = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];

function endpoint() {
  if (process.env.AI_BASE_URL) return process.env.AI_BASE_URL.replace(/\/$/, "");
  return "https://api.openai.com/v1";
}

function model() {
  return process.env.AI_MODEL || "gpt-4o-mini";
}

export function geminiModelOrder() {
  const preferred = process.env.AI_MODEL?.trim();
  return [...new Set([preferred, ...geminiFallbackModels].filter((name): name is string => Boolean(name)))];
}

export function geminiLiteModelOrder() {
  return [...new Set([...geminiLiteModels, ...geminiModelOrder()])];
}

function geminiFailureKind(status: number, body: string) {
  if (status === 429 || status === 503 || status === 500) return "busy" as const;
  if (status === 404) return "missing" as const;
  if (/RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(body)) return "busy" as const;
  if (/NOT_FOUND|not found|is not available|unknown model/i.test(body)) return "missing" as const;
  return "other" as const;
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

type CompleteOptions = {
  maxOutputTokens?: number;
  timeoutMs?: number;
  temperature?: number;
  models?: string[];
};

async function geminiComplete(system: string, user: string, options: CompleteOptions = {}) {
  let sawBusy = false;
  const models = options.models?.length ? options.models : geminiModelOrder();
  const timeoutMs = options.timeoutMs ?? 50000;
  const maxOutputTokens = options.maxOutputTokens ?? 4096;
  const temperature = options.temperature ?? 0.7;
  for (const [index, modelName] of models.entries()) {
    const attemptTimeout = index === 0 ? timeoutMs : Math.min(timeoutMs, 18000);
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
              temperature,
              maxOutputTokens,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(attemptTimeout),
        },
      );
    } catch {
      sawBusy = true;
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (geminiFailureKind(response.status, body) === "busy") sawBusy = true;
      continue;
    }

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

async function complete(system: string, user: string, options: CompleteOptions = {}) {
  if (process.env.AI_PROVIDER === "gemini" && !process.env.AI_BASE_URL) {
    return geminiComplete(system, user, options);
  }

  const response = await fetch(`${endpoint()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model(),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 25000),
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
  landscape?: boolean;
  vertical?: boolean;
  title?: string;
}): Promise<RemoteThumbnail> {
  const wantLandscape = input.landscape !== false;
  const wantVertical = input.vertical !== false;
  const fallback = localThumbnail(input);
  const keys = [
    wantLandscape ? '"landscape": string' : "",
    wantVertical ? '"vertical": string' : "",
  ].filter(Boolean);
  const data = await complete(
    `Write Google Flow image prompts. JSON only: {${keys.join(", ")}}. English instructions, under 110 words each. Include subject, background, lighting, composition, colours, on-image text, and style. Quote the on-image title exactly. If that title is Malayalam, do not translate it. Do not describe an image you generated.`,
    `Topic: ${input.topic}\nOn-image title: ${input.title?.trim() || input.topic}\nLanguage: ${input.language}\nStyle notes: ${input.styleNotes || "none"}\nFormats: ${[wantLandscape ? "16:9 YouTube" : "", wantVertical ? "9:16 Reels/Shorts" : ""].filter(Boolean).join(", ")}`,
    {
      maxOutputTokens: wantLandscape && wantVertical ? 1600 : 900,
      timeoutMs: wantLandscape && wantVertical ? 20000 : 12000,
      temperature: 0.6,
      models: geminiLiteModelOrder(),
    },
  );
  const landscape = wantLandscape && typeof data.landscape === "string" ? data.landscape.trim() : "";
  const vertical = wantVertical && typeof data.vertical === "string" ? data.vertical.trim() : "";
  if ((wantLandscape && !landscape) || (wantVertical && !vertical)) {
    throw new Error("The connected AI provider returned an incomplete prompt.");
  }
  return {
    landscape: wantLandscape ? landscape : fallback.landscape,
    vertical: wantVertical ? vertical : fallback.vertical,
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

export async function remoteAudioScript(input: {
  title: string;
  description: string;
  language: Language;
  durationSeconds: VideoDuration;
}) {
  const words = spokenWordTarget(input.durationSeconds);
  const data = await complete(
    `Write a spoken audio script for one short video. JSON only: {"script": string}.

Rules:
- Language: the requested language (Malayalam or English).
- Length: about ${words} spoken words, for a ${input.durationSeconds}-second video. Do not write a much longer or much shorter script.
- Mark time beats like [0:00], [0:08].
- This is what the creator says out loud, not camera directions.
- Sound specific to the title and how-to notes. No generic filler.`,
    `Title: ${input.title}
How to shoot: ${input.description || "(none)"}
Language: ${input.language}
Duration seconds: ${input.durationSeconds}
Spoken-word target: ${words}`,
    {
      maxOutputTokens: Math.min(2500, Math.max(600, words * 3)),
      timeoutMs: 25000,
      temperature: 0.7,
    },
  );
  const script = typeof data.script === "string" ? data.script.trim() : "";
  if (script.length < 20) {
    throw new Error("The connected AI provider returned an incomplete audio script.");
  }
  return { script: script.slice(0, 20000), provider: "remote" as const, durationSeconds: input.durationSeconds };
}

export async function remoteContentPlan(input: {
  language: Language;
  platform: Platform;
  themes: string[];
  description: string;
  count: number;
  durationSeconds: VideoDuration;
}): Promise<Omit<ContentPlan, "items"> & { items: Array<Omit<ContentPlan["items"][number], "planned_date">> }> {
  const words = spokenWordTarget(input.durationSeconds);
  const data = await complete(
    `You plan a personal YouTube and Instagram calendar. Reply with JSON only: {"items":[{"title":string,"topic":string,"description":string,"script":string}]}.

Rules:
- Return exactly ${input.count} items. No extra keys.
- Language for every field: the requested language (Malayalam or English).
- title: a finished YouTube or Instagram title the creator can paste as-is. Under 80 characters. Name the actual topic from the brief (for example Arduino, not the word "tech").
- Never write titles like "comedy: ...", "tech: ...", "aurduino: the first 10 seconds", "Idea 1", or a topic plus ": the first 10 seconds".
- Good titles sound like: "Don't start Arduino like this", "Arduino before you write any code", "വീട്ടിൽ കറന്റ് പോയാൽ ഉണ്ടാകുന്ന 3 തരം ആളുകൾ".
- topic: a short note for the creator.
- description: how to execute the video. Shot order, what to film, props, and where to stand. 4-7 short lines. Never write "tech angle:" or "comedy angle:". Never quote a placeholder title.
- script: the spoken audio script for a ${input.durationSeconds}-second video, about ${words} words, with times like [0:00]. What they say out loud.
- Mix the selected categories. Related to the brief. Do not repeat titles.`,
    `Language: ${input.language}
Platform: ${input.platform}
Categories: ${input.themes.join(", ") || "(none)"}
Brief: ${input.description || "(none)"}
Days / ideas: ${input.count}
Video length seconds: ${input.durationSeconds}
Spoken-word target per script: ${words}`,
    {
      maxOutputTokens: Math.min(8000, 900 + input.count * Math.max(500, words * 2)),
      timeoutMs: 50000,
      temperature: 0.8,
    },
  );
  const raw = Array.isArray(data.items) ? data.items : [];
  const items = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const topic = typeof row.topic === "string" ? row.topic.trim() : title;
    const description = typeof row.description === "string" ? row.description.trim() : "";
    const script = typeof row.script === "string" ? row.script.trim() : "";
    if (!title || !description) return [];
    return [{
      title: title.slice(0, 80),
      topic: (topic || title).slice(0, 500),
      description: description.slice(0, 8000),
      script: (script || localAudioScript({
        title,
        description,
        language: input.language,
        durationSeconds: input.durationSeconds,
      }).script).slice(0, 20000),
      durationSeconds: input.durationSeconds,
    }];
  });
  if (items.length < Math.min(1, input.count)) {
    throw new Error("The connected AI provider returned an incomplete plan.");
  }
  return { provider: "remote", items: items.slice(0, input.count) };
}
