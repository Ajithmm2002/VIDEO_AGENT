import type { ContentPlan, IdeaTheme, Language, Platform, VideoDuration } from "@/lib/types";
import { ideaThemes } from "@/lib/types";
import { spokenWordTarget } from "@/lib/utils";

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
  title?: string;
}): ThumbnailDraft {
  const topic = input.topic.trim();
  const overlay = clipTitle(input.title?.trim() || topic);
  const wantLandscape = input.landscape !== false;
  const wantVertical = input.vertical !== false;
  const malayalam = input.language === "ml" || containsMalayalam(overlay) || containsMalayalam(topic);
  const style =
    input.styleNotes?.trim() ||
    "clean, bold, high-end creator thumbnail with a single focal point";
  const textInstruction = malayalam
    ? `Render this exact Malayalam text on the image, spelled correctly, in a heavy rounded sans-serif with a solid plate or strong outline so it stays readable: "${overlay}". Do not translate it.`
    : `Render this short title in large readable type, in a heavy sans-serif with a contrasting plate or outline: "${overlay}".`;

  const landscape = wantLandscape
    ? [
        "Format: landscape 16:9 YouTube thumbnail, composed for a 1280x720 frame.",
        `Subject: one clear hero for "${topic}", shown close to the camera as a person, object, or symbol that is recognisable at small size. The on-image title is "${overlay}".`,
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
        `Subject: the same hero for "${topic}", centred and large, with the important detail in the upper-middle of the frame. The on-image title is "${overlay}".`,
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

const shootNotesEn = [
  "Open on the exact moment people recognise, then hold the reaction.",
  "Split the video into three kinds of people in the same situation.",
  "Cut then vs now in the same frame if you can.",
  "Name the small detail everyone notices and nobody posts.",
  "Give one practical takeaway they can try the same day.",
  "Show the mess, the wait, or the real reaction around the idea.",
  "End with a question people will actually answer.",
  "Start with the common mistake, then flip it.",
  "Keep it to one hook, one example, one closer.",
  "Tell it through the people in the room, not a lecture.",
  "One visual, one line, phone in hand.",
  "Answer the next question this topic always creates.",
];

const shootNotesMl = [
  "ആളുകൾ തിരിച്ചറിയുന്ന നിമിഷത്തിൽ തുടങ്ങി, റിയാക്ഷൻ നിർത്തി വയ്ക്കുക.",
  "ഒരേ സാഹചര്യത്തിൽ മൂന്ന് തരം ആളുകളെ കാണിക്കുക.",
  "അന്നും ഇന്നും ഒരേ ഫ്രെയിമിൽ അടുപ്പിക്കുക.",
  "എല്ലാവരും ശ്രദ്ധിക്കുന്ന, പക്ഷേ പോസ്റ്റ് ചെയ്യാത്ത ചെറിയ വിശദാംശം.",
  "ഇന്ന് തന്നെ ഉപയോഗിക്കാവുന്ന ഒരു പ്രായോഗിക കാര്യം.",
  "യഥാർത്ഥ പ്രതികരണവും കാത്തിരിപ്പും കാണിക്കുക.",
  "ആളുകൾ ഉത്തരം പറയുന്ന ഒരു ചോദ്യത്തിൽ അവസാനിപ്പിക്കുക.",
  "സാധാരണ തെറ്റ് കാണിച്ചിട്ട് ശരിയായത് പറയുക.",
  "ഹുക്ക്, ഒരു ഉദാഹരണം, ഒരു ക്ലോസർ.",
  "മുറിയിലുള്ള ആളുകളിലൂടെ കഥ പറയുക.",
  "ഒരു വിഷ്വലും ഒരു വരിയും മതി.",
  "ഈ വിഷയം ഉണ്ടാക്കുന്ന അടുത്ത സംശയത്തിന് ഉത്തരം.",
];

const themeSubjectsEn: Record<string, string> = {
  comedy: "funny reactions at home",
  nostalgia: "things we all grew up doing",
  tech: "the phone habit nobody explains",
  education: "the one lesson school skipped",
  food: "the kitchen trick everyone copies",
  lifestyle: "a tiny daily reset that actually works",
  family: "what really happens in a Malayali home",
};

const themeSubjectsMl: Record<string, string> = {
  comedy: "വീട്ടിലെ റിയാക്ഷനുകൾ",
  nostalgia: "കുട്ടിക്കാലത്ത് എല്ലാവരും ചെയ്ത കാര്യങ്ങൾ",
  tech: "ഫോണിൽ എല്ലാവരും ചെയ്യുന്ന തെറ്റ്",
  education: "സ്കൂളിൽ പഠിപ്പിക്കാത്ത ഒരു കാര്യം",
  food: "അടുക്കളയിൽ എല്ലാവരും പകർത്തുന്ന ട്രിക്ക്",
  lifestyle: "ദിവസവും ചെയ്യാവുന്ന ഒരു ചെറിയ മാറ്റം",
  family: "മലയാളി വീട്ടിൽ യഥാർത്ഥത്തിൽ നടക്കുന്നത്",
};

function clipTitle(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 80) return text;
  const cut = text.slice(0, 80);
  const space = cut.lastIndexOf(" ");
  return (space > 40 ? cut.slice(0, space) : cut).trim();
}

export function isWeakVideoTitle(title: string) {
  const text = title.trim();
  if (!text) return true;
  if (/^(comedy|nostalgia|tech|education|food|lifestyle|family)(\s*:|\s*$)/i.test(text)) return true;
  if (/^(idea|video|title|day)\s*\d+/i.test(text)) return true;
  if (/^(the first 10 seconds|60-second version|reel version|ആദ്യ 10 സെക്കൻഡ്|റീൽ വേർഷൻ|60 സെക്കൻഡ് വേർഷൻ)$/i.test(text)) return true;
  if (/:\s*(the first 10 seconds|ആദ്യ 10 സെക്കൻഡ്|60-second version|റീൽ വേർഷൻ)\s*$/i.test(text)) return true;
  return false;
}

export function isWeakHowTo(text: string) {
  const value = text.trim();
  if (!value) return true;
  if (/\b(comedy|nostalgia|tech|education|food|lifestyle|family) angle:/i.test(value)) return true;
  const quoted = value.match(/hook the idea [“"']([^”"']+)[”"']/i);
  if (quoted && isWeakVideoTitle(quoted[1])) return true;
  return false;
}

function prettySubject(text: string) {
  const cleaned = text
    .replace(/\b(aurduino|ardunio|aruino|arduino)\b/gi, "Arduino")
    .replace(/\s+/g, " ")
    .trim();
  if (/^[A-Za-z][A-Za-z0-9+.#-]*$/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function ideaSubject(brief: string, theme: string, malayalam: boolean) {
  const trimmed = brief.trim();
  const key = trimmed.toLowerCase();
  const themeKey = ideaThemes.includes(key as IdeaTheme) ? key : theme;
  if (!trimmed || ideaThemes.includes(key as IdeaTheme)) {
    return malayalam
      ? themeSubjectsMl[themeKey] ?? "വീട്ടിലെ ഒരു നിമിഷം"
      : themeSubjectsEn[themeKey] ?? "a moment at home";
  }
  return prettySubject(trimmed);
}

function titleTemplates(theme: string, subject: string, malayalam: boolean) {
  if (malayalam) {
    if (theme === "tech") {
      return [
        `${subject} ഇങ്ങനെ തുടങ്ങരുത്`,
        `POV: ആദ്യമായി ${subject}`,
        `${subject} സെറ്റപ്പ് എല്ലാവരും ഒഴിവാക്കും`,
        `കോഡ് എഴുതുന്നതിന് മുമ്പ് ${subject}`,
        `${subject} ഇങ്ങനെ വയർ ചെയ്യരുത്`,
        `ആദ്യ ${subject} പ്രോജക്റ്റ് ഇതാണ്`,
        `${subject} 60 സെക്കൻഡിൽ`,
        `${subject} ഒരു മണിക്കൂർ നഷ്ടമാക്കുന്ന തെറ്റ്`,
        `ആദ്യം ചെയ്യേണ്ടത് | ${subject}`,
        `${subject} | ഒരു വർക്കിങ് സർക്യൂട്ട്`,
        `${subject} ഉപയോഗിച്ച് തുടങ്ങാം`,
        `അടുത്ത ഭാഗം | ${subject}`,
      ];
    }
    return [
      `3 തരം ആളുകൾ | ${subject}`,
      `POV: ${subject}`,
      `ആരും പോസ്റ്റ് ചെയ്യാറില്ല | ${subject}`,
      `${subject} വീട്ടിൽ ആകുമ്പോൾ`,
      `ഇങ്ങനെ ചെയ്യരുത് | ${subject}`,
      `കണ്ടിട്ടുള്ളവർക്ക് മാത്രം | ${subject}`,
      `യഥാർത്ഥത്തിൽ നടക്കുന്നത് | ${subject}`,
      `ഒരു സത്യം | ${subject}`,
      `${subject} vs നമ്മൾ കാണിക്കുന്നത്`,
      `ആരും പറയാറില്ല | ${subject}`,
      `ഒരു ക്ലിപ്പിൽ | ${subject}`,
      `അടുത്ത ഭാഗം | ${subject}`,
    ];
  }
  if (theme === "tech") {
    return [
      `Don't start ${subject} like this`,
      `POV: first time with ${subject}`,
      `The ${subject} setup everyone skips`,
      `${subject} before you write any code`,
      `Stop wiring ${subject} like this`,
      `Your first ${subject} project that works`,
      `${subject} in 60 seconds`,
      `The ${subject} mistake that wastes an hour`,
      `What to do first | ${subject}`,
      `${subject} | one working circuit`,
      `Unbox ${subject} the useful way`,
      `The follow-up | ${subject}`,
    ];
  }
  if (theme === "education") {
    return [
      `The ${subject} lesson nobody explains`,
      `Learn ${subject} in 60 seconds`,
      `Stop learning ${subject} like this`,
      `${subject} | one example is enough`,
      `POV: finally understanding ${subject}`,
      `The ${subject} mistake beginners make`,
      `What to do first | ${subject}`,
      `${subject} without the boring part`,
      `A 60-second truth | ${subject}`,
      `${subject} in one honest clip`,
      `Nobody teaches ${subject} like this`,
      `The follow-up | ${subject}`,
    ];
  }
  return [
    `3 types of people | ${subject}`,
    `POV: ${subject}`,
    `Nobody posts this part | ${subject}`,
    `${subject} hits different at home`,
    `Stop doing this | ${subject}`,
    `If you grew up with this | ${subject}`,
    `What actually happens | ${subject}`,
    `A 60-second truth | ${subject}`,
    `${subject} vs how we pretend it goes`,
    `Nobody talks about this | ${subject}`,
    `${subject} in one honest clip`,
    `The follow-up | ${subject}`,
  ];
}

export function publishableVideoTitle(input: {
  brief: string;
  theme: string;
  index: number;
  language: Language;
}) {
  const malayalam = input.language === "ml" || containsMalayalam(input.brief);
  const subject = ideaSubject(input.brief, input.theme, malayalam);
  const titles = titleTemplates(input.theme, subject, malayalam);
  return clipTitle(titles[input.index % titles.length]);
}

function shootNote(theme: string, index: number, malayalam: boolean) {
  const techEn = [
    "Show the board, the cable, and the first working result in close-up.",
    "Film the wrong wiring or setup, then cut to the correct one.",
    "Keep the screen or LED in frame so the result is obvious.",
    "One step on camera, then say why it matters.",
    "Start with the common beginner mistake, then flip it.",
    "Hands only, then a wide shot of the finished setup.",
    "End by asking what they want to build next.",
    "Show power on, the first blink, and your reaction.",
  ];
  const techMl = [
    "ബോർഡ്, കേബിൾ, ആദ്യത്തെ വർക്കിങ് റിസൾട്ട് ക്ലോസ്-അപ്പിൽ.",
    "തെറ്റായ വയറിങ് കാണിച്ചിട്ട് ശരിയായത് കട്ട് ചെയ്യുക.",
    "സ്ക്രീനോ LED-ഓ ഫ്രെയിമിൽ വയ്ക്കുക.",
    "ഒരു സ്റ്റെപ്പ് ക്യാമറയിൽ, പിന്നെ എന്തുകൊണ്ട് എന്ന് പറയുക.",
    "സാധാരണ തെറ്റ് കാണിച്ചിട്ട് ശരിയായത് കാണിക്കുക.",
    "കൈകൾ മാത്രം, പിന്നെ ഫിനിഷ്ഡ് സെറ്റപ്പ്.",
    "അടുത്തത് എന്ത് ഉണ്ടാക്കണം എന്ന് ചോദിച്ച് അവസാനിപ്പിക്കുക.",
    "പവർ ഓൺ, ആദ്യ ബ്ലിങ്ക്, നിങ്ങളുടെ റിയാക്ഷൻ.",
  ];
  const notes = theme === "tech" ? (malayalam ? techMl : techEn) : malayalam ? shootNotesMl : shootNotesEn;
  return notes[index % notes.length];
}

function howToShoot(title: string, note: string, malayalam: boolean, platform: Platform, subject: string) {
  const thing = subject || (malayalam ? "വിഷയം" : "the subject");
  if (malayalam) {
    return [
      "എങ്ങനെ ചെയ്യാം",
      `1. ആദ്യ ഷോട്ട്: ${thing} ക്ലോസ്-അപ്പിൽ, പിന്നെ നിങ്ങളുടെ റിയാക്ഷൻ.`,
      `2. ${note}`,
      `3. ടൈറ്റിൽ “${title}” ആക്കുന്ന ഒരു വ്യക്തമായ ഉദാഹരണം കാണിക്കുക.`,
      "4. അവസാനം ഒരു ചോദ്യം അല്ലെങ്കിൽ CTA.",
      platform === "instagram" ? "ക്യാമറ: ഫോൺ വെർട്ടിക്കൽ, സ്ഥിരമായ ലൈറ്റ്." : "ക്യാമറ: 16:9 അല്ലെങ്കിൽ വെർട്ടിക്കൽ ഷോർട്സ്.",
    ].join("\n");
  }
  return [
    "How to shoot this",
    `1. Opening shot: close-up of ${thing}, then your reaction.`,
    `2. ${note}`,
    `3. Show one clear example that matches “${title}”. Keep cuts short.`,
    "4. Close on a question or a one-line CTA.",
    platform === "instagram" ? "Camera: phone vertical, steady light, one location." : "Camera: 16:9 or a vertical Short, one location.",
  ].join("\n");
}

type PlanDraftItem = {
  title: string;
  topic: string;
  description: string;
  script: string;
  durationSeconds: VideoDuration;
};

export function polishPlanItem(input: {
  item: PlanDraftItem;
  brief: string;
  theme: string;
  index: number;
  language: Language;
  platform: Platform;
  durationSeconds: VideoDuration;
}): PlanDraftItem {
  const malayalam = input.language === "ml" || containsMalayalam(input.brief) || containsMalayalam(input.item.title);
  const oldTitle = input.item.title.trim();
  const title = isWeakVideoTitle(oldTitle)
    ? publishableVideoTitle({
        brief: input.brief,
        theme: input.theme,
        index: input.index,
        language: malayalam ? "ml" : input.language,
      })
    : clipTitle(oldTitle);
  const subject = ideaSubject(input.brief, input.theme, malayalam);
  const rewriteHowTo = isWeakHowTo(input.item.description) || (isWeakVideoTitle(oldTitle) && input.item.description.includes(oldTitle));
  const description = rewriteHowTo
    ? howToShoot(title, shootNote(input.theme, input.index, malayalam), malayalam, input.platform, subject)
    : input.item.description.trim();
  const rewriteScript = !input.item.script.trim() || (isWeakVideoTitle(oldTitle) && input.item.script.includes(oldTitle));
  const script = rewriteScript
    ? localAudioScript({
        title,
        description,
        language: malayalam ? "ml" : input.language,
        durationSeconds: input.durationSeconds,
      }).script
    : input.item.script;
  return {
    title,
    topic: (input.item.topic.trim() || subject).slice(0, 500),
    description: description.slice(0, 8000),
    script: script.slice(0, 20000),
    durationSeconds: input.durationSeconds,
  };
}

function padSpoken(lines: string[], targetWords: number) {
  const extra = [
    "Stay on the same thought. Do not rush the last line.",
    "Leave a short pause before the next beat.",
    "Keep your voice close to the mic and speak clearly.",
    "Look at the camera for the last sentence.",
  ];
  const spoken = [...lines];
  let words = spoken.join(" ").split(/\s+/).length;
  let i = 0;
  while (words < targetWords && i < 12) {
    spoken.push(extra[i % extra.length]);
    words = spoken.join(" ").split(/\s+/).length;
    i += 1;
  }
  return spoken;
}

export function localAudioScript(input: {
  title: string;
  description: string;
  language: Language;
  durationSeconds: VideoDuration;
}) {
  const malayalam = input.language === "ml" || containsMalayalam(input.title) || containsMalayalam(input.description);
  const seconds = input.durationSeconds;
  const target = spokenWordTarget(seconds);
  const title = input.title.trim() || (malayalam ? "ഈ വീഡിയോ" : "this video");

  const englishBeats = [
    `[0:00] ${title}. Watch this till the end.`,
    `[0:04] Here is the situation in one line.`,
    "[0:10] Most people get this part wrong.",
    "[0:16] Do this instead, step by step.",
    "[0:24] That small change is the whole point.",
    `[0:32] If you have lived ${title.toLowerCase()}, you already know this feeling.`,
    "[0:42] Show the example on camera. Keep it real.",
    "[0:55] Recap the one thing they should remember.",
    "[1:10] Add the next detail only if you still have time.",
    "[1:30] Repeat the hook in a calmer voice.",
    "[2:00] Give one practical takeaway they can try today.",
    "[2:40] Ask a comment question they can answer in three words.",
    "[3:20] Hold the last shot. Do not add a new topic.",
    "[4:20] Thank them, then repeat the CTA once.",
  ];

  const malayalamBeats = [
    `[0:00] ${title}. അവസാനം വരെ കാണൂ.`,
    "[0:04] സാഹചര്യം ഒരു വാചകത്തിൽ.",
    "[0:10] മിക്ക ആളുകളും ഇവിടെ തെറ്റ് ചെയ്യും.",
    "[0:16] ഇങ്ങനെ ചെയ്യൂ, ഘട്ടം ഘട്ടമായി.",
    "[0:24] ആ ചെറിയ മാറ്റമാണ് കാര്യം.",
    "[0:32] ഇത് നിങ്ങൾക്ക് അറിയാവുന്ന ഒരു അനുഭവമാണ്.",
    "[0:42] ക്യാമറയിൽ ഉദാഹരണം കാണിക്കൂ.",
    "[0:55] ഓർമ്മിക്കേണ്ട ഒരു കാര്യം മാത്രം ആവർത്തിക്കൂ.",
    "[1:10] സമയമുണ്ടെങ്കിൽ അടുത്ത വിശദാംശം ചേർക്കൂ.",
    "[1:30] ഹുക്ക് ശാന്തമായി വീണ്ടും പറയൂ.",
    "[2:00] ഇന്ന് ചെയ്യാവുന്ന ഒരു കാര്യം പറയൂ.",
    "[2:40] മൂന്ന് വാക്കിൽ ഉത്തരം പറയാവുന്ന ഒരു ചോദ്യം.",
    "[3:20] അവസാന ഷോട്ട് നിർത്തി വയ്ക്കൂ. പുതിയ വിഷയം വേണ്ട.",
    "[4:20] നന്ദി പറഞ്ഞ് CTA ഒരിക്കൽ കൂടി.",
  ];

  const beats = malayalam ? malayalamBeats : englishBeats;
  const take = seconds <= 15 ? 2 : seconds <= 30 ? 4 : seconds <= 45 ? 5 : seconds <= 60 ? 6 : seconds <= 90 ? 8 : seconds <= 120 ? 10 : seconds <= 180 ? 12 : 14;
  const lines = padSpoken(beats.slice(0, take), target);
  const header = malayalam
    ? `ഓഡിയോ സ്ക്രിപ്റ്റ് · ${seconds < 90 ? `${seconds} സെക്കൻഡ്` : `${seconds / 60} മിനിറ്റ്`} · ഏകദേശം ${target} വാക്ക്`
    : `Audio script · ${seconds < 90 ? `${seconds} sec` : `${seconds / 60} min`} · about ${target} spoken words`;
  return {
    script: [header, "", ...lines].join("\n"),
    provider: "local" as const,
    durationSeconds: seconds,
  };
}

export function localContentPlan(input: {
  language: Language;
  platform: Platform;
  themes: string[];
  description: string;
  count: number;
  durationSeconds: VideoDuration;
}): Omit<ContentPlan, "items"> & { items: Array<Omit<ContentPlan["items"][number], "planned_date">> } {
  const brief = input.description.trim();
  const malayalam = input.language === "ml" || containsMalayalam(brief);
  const themes = input.themes.length ? input.themes : malayalam ? ["family"] : ["lifestyle"];
  const items = Array.from({ length: input.count }, (_, index) => {
    const theme = themes[index % themes.length];
    const title = publishableVideoTitle({ brief, theme, index, language: malayalam ? "ml" : input.language });
    const topic = ideaSubject(brief, theme, malayalam).slice(0, 500);
    const description = howToShoot(
      title,
      shootNote(theme, index, malayalam),
      malayalam,
      input.platform,
      topic,
    );
    const audio = localAudioScript({
      title,
      description,
      language: malayalam ? "ml" : "en",
      durationSeconds: input.durationSeconds,
    });
    return {
      title,
      topic,
      description,
      script: audio.script,
      durationSeconds: input.durationSeconds,
    };
  });
  return { provider: "local", items };
}
