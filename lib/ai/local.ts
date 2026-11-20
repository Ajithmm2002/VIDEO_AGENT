import type { Language, Platform } from "@/lib/types";

export type ThumbnailDraft = {
  landscape: string;
  vertical: string;
  language: Language;
  provider: "local";
};

export type WritingDraft = {
  titles: string[];
  youtubeDescription: string;
  instagramCaption: string;
  tags: string[];
  hashtags: string[];
  hook: string;
  scriptOutline: string;
  provider: "local";
};

export function containsMalayalam(text: string) {
  return /[\u0D00-\u0D7F]/.test(text);
}

function latinWords(topic: string) {
  return topic
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !containsMalayalam(word) && /^[A-Za-z0-9]+$/.test(word));
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function toEnglishTags(values: string[], count: number) {
  return unique(
    values.map((value) =>
      value
        .replace(/^#/, "")
        .replace(/[\u0D00-\u0D7F]/g, "")
        .replace(/[^\x00-\x7F]/g, "")
        .trim(),
    ).filter((value) => /^[A-Za-z0-9][A-Za-z0-9 &'/-]{0,79}$/.test(value)),
  ).slice(0, count);
}

export function toEnglishHashtags(values: string[], count: number) {
  return unique(
    values.map((value) => {
      const compact = value.replace(/[\u0D00-\u0D7F]/g, "").replace(/[^A-Za-z0-9]+/g, "");
      return compact.length > 1 ? `#${compact}` : "";
    }).filter(Boolean),
  ).slice(0, count);
}

function fillList(seed: string[], extras: string[], count: number, kind: "tag" | "hashtag") {
  const source = kind === "hashtag" ? toEnglishHashtags([...seed, ...extras], 80) : toEnglishTags([...seed, ...extras], 80);
  const filled = [...source];
  const bases = filled.length ? filled : kind === "hashtag" ? ["#Topic"] : ["topic"];
  let i = 1;
  while (filled.length < count && i < 80) {
    const base = bases[(i - 1) % bases.length];
    const next = kind === "hashtag"
      ? `#${base.replace(/^#/, "")}${i}`
      : `${base.replace(/^#/, "")} ${i}`;
    const clean = kind === "hashtag" ? toEnglishHashtags([next], 1)[0] : toEnglishTags([next], 1)[0];
    if (clean && !filled.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      filled.push(clean);
    }
    i += 1;
  }
  return filled.slice(0, count);
}

export function hashtagsFor(topic: string, platform: Platform, language: Language, count = 12) {
  const malayalam = language === "ml" || containsMalayalam(topic);
  const fromTopic = latinWords(topic).map((word) => `#${word}`);
  const extras = [
    ...fromTopic,
    malayalam ? "#Malayalam" : "#Creator",
    malayalam ? "#Kerala" : "#Tutorial",
    malayalam ? "#MalayalamYouTube" : "#Explained",
    malayalam ? "#Mollywood" : "#HowTo",
    platform !== "instagram" ? "#YouTube" : "",
    platform !== "instagram" ? "#YouTubeTips" : "",
    platform !== "instagram" ? "#Shorts" : "",
    platform !== "youtube" ? "#Instagram" : "",
    platform !== "youtube" ? "#Reels" : "",
    "#Tips",
    "#Guide",
    "#Beginner",
    "#MustWatch",
    "#LearnOnYouTube",
    "#Daily",
    "#Vlog",
  ];
  return fillList(fromTopic, extras, count, "hashtag");
}

export function tagsFor(topic: string, platform: Platform, language: Language, count = 12) {
  const malayalam = language === "ml" || containsMalayalam(topic);
  const fromTopic = latinWords(topic);
  const extras = [
    ...fromTopic,
    malayalam ? "Malayalam" : "tutorial",
    malayalam ? "Kerala" : "explained",
    malayalam ? "Malayalam YouTube" : "how to",
    platform !== "instagram" ? "YouTube" : "",
    platform !== "instagram" ? "YouTube tags" : "",
    platform !== "youtube" ? "Instagram" : "",
    "beginner",
    "guide",
    "tips",
    "vlog",
    topic.replace(/[\u0D00-\u0D7F]/g, "").trim(),
  ];
  return fillList(fromTopic, extras, count, "tag");
}

export function localThumbnail(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
  landscape?: boolean;
  vertical?: boolean;
}): ThumbnailDraft {
  const topic = input.topic.trim();
  const wantLandscape = input.landscape !== false;
  const wantVertical = input.vertical !== false;
  const malayalam = input.language === "ml" || containsMalayalam(topic);
  const style =
    input.styleNotes?.trim() ||
    "clean, bold, high-end creator thumbnail with a single focal point";
  const textInstruction = malayalam
    ? `Render this exact Malayalam text on the image, spelled correctly, in a heavy rounded sans-serif with a solid plate or strong outline so it stays readable: "${topic}". Do not translate it.`
    : `Render this short title in large readable type, in a heavy sans-serif with a contrasting plate or outline: "${topic.slice(0, 80)}".`;

  const landscape = wantLandscape
    ? [
        "Format: landscape 16:9 YouTube thumbnail, composed for a 1280x720 frame.",
        `Subject: one clear hero for "${topic}", shown close to the camera as a person, object, or symbol that is recognisable at small size.`,
        "Background: a simple layered background with a soft gradient and one supporting shape. Leave it uncluttered so the subject and title win.",
        "Lighting: bright key light from the front-left and a gentle rim light that separates the subject from the background.",
        "Composition: subject on the right third, open space on the left for the title, with about 6% safe margin on every edge.",
        "Colours: deep teal, warm sand, and one amber accent. Use high contrast and no more than three dominant colours.",
        `Text placement: title block on the left third, vertically centred, two lines maximum. ${textInstruction}`,
        `Visual style: ${style}. Sharp edges, no watermark, no logo, no extra captions, no collage.`,
        "Avoid: warped letters, tiny text, cluttered backgrounds, extra objects, and muddy shadows.",
      ].join("\n")
    : "";

  const vertical = wantVertical
    ? [
        "Format: vertical 9:16 thumbnail for Instagram Reels and YouTube Shorts, composed for a 1080x1920 frame.",
        `Subject: the same hero for "${topic}", centred and large, with the important detail in the upper-middle of the frame.`,
        "Background: a tall simple gradient with one bold shape behind the subject. Keep the lower fifth quiet because the app interface covers it.",
        "Lighting: bright frontal key light and a slim rim light, with the main subject evenly lit.",
        "Composition: centred vertical stack. Keep important details inside the central safe area, away from the top 12% and the bottom 20%.",
        "Colours: the same deep teal, warm sand, and amber accent, with stronger contrast for a phone screen.",
        `Text placement: short title in the upper third, centred, one or two lines. ${textInstruction}`,
        `Visual style: ${style}. Bold silhouette for a phone screen, no watermark, no logo, no tiny text, no busy collage.`,
        "Avoid: warped letters, edge-cropped faces, clutter, and details hidden by Reels controls.",
      ].join("\n")
    : "";

  return {
    landscape,
    vertical,
    language: malayalam ? "ml" : "en",
    provider: "local",
  };
}

function scriptOutline(topic: string, tone: string, malayalam: boolean) {
  if (malayalam) {
    return [
      "Hook (0–8 സെക്കൻഡ്): ആദ്യ വാചകത്തിൽ തന്നെ സംശയം പറയുക.",
      `Context: ${topic} എന്തുകൊണ്ട് ഇപ്പോൾ പ്രസക്തമാണ് എന്ന് ഒരു വാചകത്തിൽ പറയുക.`,
      "Point 1: ഏറ്റവും പ്രധാനപ്പെട്ട ആശയം ഒരു ഉദാഹരണത്തോടെ.",
      "Point 2: സാധാരണ തെറ്റ്, അത് ഒഴിവാക്കുന്ന വിധം.",
      "Point 3: കാണുന്നയാൾക്ക് ഇന്ന് ചെയ്യാവുന്ന ഒരു ചെറിയ നടപടി.",
      "Close: ഒരു വാചകത്തിൽ സാരം പറഞ്ഞ് കമന്റിൽ ഒരു ചോദ്യം ചോദിക്കുക.",
      `Tone to keep: ${tone || "സൗഹൃദപരവും വ്യക്തവും"}`,
    ].join("\n");
  }

  return [
    "Hook (0–8 seconds): answer the viewer’s first question in one sentence.",
    `Context: why ${topic} matters right now.`,
    "Point 1: the main idea, with one concrete example.",
    "Point 2: the common mistake, and how to avoid it.",
    "Point 3: one small step the viewer can take today.",
    "Close: restate the point in one line and ask a comment question.",
    `Tone to keep: ${tone || "warm, clear, and specific"}`,
  ].join("\n");
}

export type TopicCopy = {
  description: string;
  youtubeDescription: string;
  instagramCaption: string;
  tags: string[];
  hashtags: string[];
  provider: "local" | "remote";
};

export function localTopicCopy(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tagCount: number;
  hashtagCount: number;
  title?: string;
  notes?: string;
}): TopicCopy {
  const draft = localWriting({
    topic: input.topic,
    language: input.language,
    platform: input.platform,
    title: input.title,
    notes: input.notes,
    tagCount: input.tagCount,
    hashtagCount: input.hashtagCount,
  });
  return {
    description: draft.youtubeDescription,
    youtubeDescription: draft.youtubeDescription,
    instagramCaption: draft.instagramCaption,
    tags: draft.tags,
    hashtags: draft.hashtags,
    provider: "local",
  };
}

function englishDescription(topic: string, title?: string, notes?: string) {
  const subject = title?.trim() || topic;
  return [
    `🔥 ${subject} — a practical walkthrough, not a vague overview.`,
    "",
    "📌 In this video:",
    `✅ What ${topic} actually means, and who it helps`,
    "✅ The 3 points that change how you approach it",
    "✅ One example you can try the same day",
    ...(notes?.trim() ? ["", `🧠 From the notes: ${notes.trim().slice(0, 280)}`] : []),
    "",
    "💬 Comment the next question you want covered.",
    "👍 Save this if you are going to try it.",
  ].join("\n");
}

function malayalamDescription(topic: string, title?: string, notes?: string) {
  const subject = title?.trim() || topic;
  return [
    `🔥 ${subject} — വ്യക്തമായ ഒരു വിശദീകരണം, ഫിൽലർ അല്ല.`,
    "",
    "📌 ഈ വീഡിയോയിൽ:",
    `✅ ${topic} എന്താണ്, ആർക്കാണ് ഉപകാരപ്പെടുക`,
    "✅ മാറ്റമുണ്ടാക്കുന്ന മൂന്ന് കാര്യങ്ങൾ",
    "✅ ഇന്ന് തന്നെ പരീക്ഷിക്കാവുന്ന ഒരു ഉദാഹരണം",
    ...(notes?.trim() ? ["", `🧠 നോട്ടിൽ നിന്ന്: ${notes.trim().slice(0, 280)}`] : []),
    "",
    "💬 അടുത്ത ചോദ്യം കമന്റിൽ എഴുതുക.",
    "👍 ഉപകാരപ്പെട്ടാൽ സേവ് ചെയ്യുക.",
  ].join("\n");
}

export function localWriting(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
  tagCount?: number;
  hashtagCount?: number;
  title?: string;
  notes?: string;
}): WritingDraft {
  const topic = input.topic.trim();
  const malayalam = input.language === "ml" || containsMalayalam(topic) || containsMalayalam(input.title ?? "") || containsMalayalam(input.notes ?? "");
  const tone = input.tone?.trim() ?? "";
  const tags = tagsFor(topic, input.platform, malayalam ? "ml" : "en", input.tagCount ?? 12);
  const hashtags = hashtagsFor(topic, input.platform, malayalam ? "ml" : "en", input.hashtagCount ?? 15);
  const youtubeDescription = malayalam
    ? malayalamDescription(topic, input.title, input.notes)
    : englishDescription(topic, input.title, input.notes);

  if (malayalam) {
    return {
      titles: [
        `${topic}: അറിഞ്ഞിരിക്കേണ്ട കാര്യങ്ങൾ`,
        `${topic} ലളിതമായി മനസ്സിലാക്കാം`,
        `${topic} — ഒരു വ്യക്തമായ വിശദീകരണം`,
      ],
      hook: `🎯 ${topic} കേൾക്കുമ്പോൾ ആദ്യം വരുന്ന സംശയം നേരിട്ട് പറഞ്ഞ് തുടങ്ങുക. ഒരു ചെറിയ ഉദാഹരണം കൂടി ചേർത്താൽ കാണുന്നയാൾ തുടർന്നും നിൽക്കും.`,
      youtubeDescription,
      instagramCaption: [
        `✨ ${topic} — ചുരുക്കത്തിൽ.`,
        "🎥 മുഴുവൻ വിശദീകരണം വീഡിയോയിൽ ഉണ്ട്.",
        "💬 നിങ്ങളുടെ അഭിപ്രായം കമന്റിൽ എഴുതുക.",
      ].join("\n"),
      tags,
      hashtags,
      scriptOutline: scriptOutline(topic, tone, true),
      provider: "local",
    };
  }

  return {
    titles: [
      `${topic}: what actually matters`,
      `${topic}, explained without the fluff`,
      `The practical guide to ${topic}`,
    ],
    hook: `🎯 Start with the question people already have about ${topic}, then promise one clear answer in the next few seconds.`,
    youtubeDescription,
    instagramCaption: [
      `✨ ${topic}, in one minute.`,
      "🎥 The full breakdown is in the video.",
      "💬 Tell me what you would add.",
    ].join("\n"),
    tags,
    hashtags,
    scriptOutline: scriptOutline(topic, tone, false),
    provider: "local",
  };
}
