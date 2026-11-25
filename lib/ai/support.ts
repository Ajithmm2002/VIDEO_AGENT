import { ERROR_GUIDES, HELP_ARTICLES } from "@/lib/ai/app-working";
import { remoteAiEnabled } from "@/lib/env";
import { contactSupportReply, EXAMPLE_SUPPORT_EMAIL, EXAMPLE_SUPPORT_PHONE, SUPPORT_QUICK_PROMPTS } from "@/lib/ai/support-public";
import {
  buildIndex,
  focusedExcerpt,
  MIN_CONFIDENT_SCORE,
  looksLikeError,
  rankArticles,
  retrievalQuery,
  suggestionFor,
  terms,
  type ChatTurn,
  type GuideArticle,
  type RankedArticle,
  type SupportAnswer,
} from "@/lib/ai/support-engine";

export { contactSupportReply, EXAMPLE_SUPPORT_EMAIL, EXAMPLE_SUPPORT_PHONE, SUPPORT_QUICK_PROMPTS } from "@/lib/ai/support-public";
export { ERROR_GUIDES, HELP_ARTICLES } from "@/lib/ai/app-working";
export type { SupportAnswer } from "@/lib/ai/support-engine";

const ALL_ARTICLES: GuideArticle[] = [...HELP_ARTICLES, ...ERROR_GUIDES];
const INDEX = buildIndex(ALL_ARTICLES);

const CONTACT_PHRASES = [
  "support email",
  "support number",
  "phone number",
  "contact number",
  "mobile number",
  "customer support",
  "customer care",
  "customer service",
  "contact us",
  "contact support",
  "helpline",
  "hotline",
  "whatsapp",
  "call you",
  "call support",
  "email address",
  "support phone",
  "customer number",
  "talk to a human",
  "talk to a person",
  "real person",
  "speak to someone",
];

export function wantsContact(question: string) {
  const text = question.toLowerCase();
  if (CONTACT_PHRASES.some((phrase) => text.includes(phrase))) return true;
  if (/\b(email|e-mail|phone|mobile|number)\b/.test(text) && /\b(support|contact|customer|helpline|reach you)\b/.test(text)) {
    return true;
  }
  if (/\bwhat(?:'s| is) (?:your |the )?(?:support )?(?:email|e-mail|phone|number)\b/.test(text)) return true;
  if (/\b(send|share|give me)\b.{0,28}\b(email|e-mail|phone|number)\b/.test(text)) return true;
  return false;
}

const GREETING = /^(hi|hii+|hello|hey|hai|namaste|good (morning|afternoon|evening))[\s!.,]*$/i;
const THANKS = /^(thanks|thank you|thx|ty|ok(ay)?|cool|great|got it|nice|perfect)[\s!.,]*(thanks|thank you)?[\s!.,]*$/i;

const DEFAULT_SUGGESTIONS = SUPPORT_QUICK_PROMPTS;

function suggestionsFrom(ranked: RankedArticle[], exclude: Set<string>, count = 3) {
  const result: string[] = [];
  for (const row of ranked) {
    if (exclude.has(row.article.title)) continue;
    const suggestion = suggestionFor(row.article);
    if (!result.includes(suggestion)) result.push(suggestion);
    if (result.length >= count) break;
  }
  return result;
}

/**
 * Answer only from the guide. Returns the best article's most relevant sentences, adds a
 * second article when it is nearly as relevant (for example an error guide plus the page
 * guide), and asks a clarifying question when nothing matches well.
 */
export function localSupportAnswer(question: string, history: ChatTurn[] = [], page?: string | null): SupportAnswer {
  const text = question.trim();
  if (!text) {
    return { reply: "Write a short question about Content Studio.", sources: [], suggestions: [...DEFAULT_SUGGESTIONS], confidence: "none" };
  }
  if (GREETING.test(text)) {
    return {
      reply: "Hi! Ask me how any page works, or paste the exact error message you see and I will tell you the next step.",
      sources: [],
      suggestions: [...DEFAULT_SUGGESTIONS],
      confidence: "high",
    };
  }
  if (THANKS.test(text)) {
    return { reply: "Glad that helped. Ask anytime if something else comes up.", sources: [], suggestions: [], confidence: "high" };
  }

  const contact = wantsContact(text);
  const ranked = rankArticles(INDEX, retrievalQuery(text, history), { page });
  const top = ranked[0];

  // A plain request for a phone or email gets the contact details, not a guide section.
  if (contact && !looksLikeError(text)) {
    return {
      reply: contactSupportReply(),
      sources: ["Contact support"],
      suggestions: suggestionsFrom(ranked.filter((row) => row.article.title !== "This support chat"), new Set(), 2),
      confidence: "high",
    };
  }

  if (!top || top.score < MIN_CONFIDENT_SCORE) {
    if (contact) {
      return { reply: contactSupportReply(), sources: ["Contact support"], suggestions: [], confidence: "high" };
    }
    const options = suggestionsFrom(ranked, new Set(), 3);
    return {
      reply: options.length
        ? "I am not sure which part of the studio you mean. Is it one of these? You can also paste the exact message you see on screen."
        : "I could not find that in the studio guide. Tell me which page you are on and what you tried, or paste the exact message you see. You can also ask for the support email.",
      sources: [],
      suggestions: options.length ? options : [...DEFAULT_SUGGESTIONS],
      confidence: top ? "low" : "none",
    };
  }

  const used = [top];
  const second = ranked[1];
  const twoQuestions = /\b(and also|also|as well|and how|and where|and what|and why)\b|\?.+\S/i.test(text);
  if (
    second &&
    ((second.score >= top.score * 0.75 && second.article.kind !== top.article.kind) || (twoQuestions && second.score >= top.score * 0.4))
  ) {
    used.push(second);
  }

  const parts = used.map((row, position) => focusedExcerpt(row.article, text, position === 0 ? 4 : 2));
  if (contact) parts.push(contactSupportReply());
  const sources = used.map((row) => row.article.title);
  if (contact) sources.push("Contact support");

  return {
    reply: parts.join("\n\n"),
    sources,
    suggestions: suggestionsFrom(ranked, new Set(sources), 2),
    confidence: "high",
  };
}

/** Kept for existing callers and tests: the reply text only. */
export function localSupportReply(question: string, history: ChatTurn[] = [], page?: string | null) {
  return localSupportAnswer(question, history, page).reply;
}

const SYSTEM_RULES = `You are the in-app support assistant for Content Studio.

Rules:
- Answer ONLY from the guide excerpts provided. If they do not cover the question, set "answered" to false and say briefly what you can help with instead.
- Be specific: name the page, button, or menu to use, and the next step. 2 to 5 short sentences. No marketing language.
- Never invent features, prices, limits, emails, phone numbers, WhatsApp numbers, links, or payment options.
- If the person asks for contact details, give exactly: ${EXAMPLE_SUPPORT_EMAIL} and ${EXAMPLE_SUPPORT_PHONE}, and say they are example details.
- Never ask for passwords, OTPs, or bank details. Coins are an in-app reward, never cash.
- Reply in the language the person wrote in when you can.
- Return JSON only: {"reply": string, "answered": boolean, "sources": string[]} where sources are the excerpt titles you used.`;

const ALLOWED_EMAILS = new Set([EXAMPLE_SUPPORT_EMAIL.toLowerCase()]);

/** Reject model output that invents contact details or links. */
export function safeModelReply(reply: string) {
  const emails = reply.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
  if (emails.some((email) => !ALLOWED_EMAILS.has(email.toLowerCase()))) return false;
  const digits = reply.replace(/[^\d+]/g, " ").match(/\+?\d[\d ]{8,}\d/g) ?? [];
  const allowedPhone = EXAMPLE_SUPPORT_PHONE.replace(/\D/g, "");
  if (digits.some((value) => value.replace(/\D/g, "") !== allowedPhone && value.replace(/\D/g, "").length >= 10)) return false;
  if (/https?:\/\/(?!labs\.google)/i.test(reply)) return false;
  return true;
}

function isComplexQuestion(question: string) {
  return terms(question).length >= 6 || /[?].+[?]/.test(question) || /\b(and also|as well as|difference between|compare)\b/i.test(question);
}

export async function answerSupport(question: string, history: ChatTurn[], page?: string | null): Promise<SupportAnswer> {
  const trimmed = question.trim().slice(0, 500);
  const local = localSupportAnswer(trimmed, history, page);
  // Exact guide answers are the most accurate. Only ask the model to phrase an answer when the
  // question is long or mixes topics, or when the guide match is weak, and always ground it.
  const useModel = remoteAiEnabled() && !wantsContact(trimmed) && (local.confidence !== "high" || isComplexQuestion(trimmed));
  if (!useModel || !trimmed) return local;

  const ranked = rankArticles(INDEX, retrievalQuery(trimmed, history), { page }).slice(0, 4);
  if (!ranked.length) return local;

  try {
    const { completeSupportJson } = await import("@/lib/ai/remote");
    const excerpts = ranked.map((row) => `### ${row.article.title}\n${row.article.body}`).join("\n\n");
    const data = await completeSupportJson(
      `${SYSTEM_RULES}\n\nGuide excerpts:\n${excerpts}`,
      JSON.stringify({
        page: page ?? null,
        history: history.slice(-6).map((item) => ({ role: item.role, content: item.content.slice(0, 400) })),
        question: trimmed,
      }),
    );
    const reply = typeof data.reply === "string" ? data.reply.trim() : "";
    if (!reply || data.answered === false || !safeModelReply(reply)) return local;
    const titles = new Set(ranked.map((row) => row.article.title));
    const sources = Array.isArray(data.sources)
      ? data.sources.filter((item): item is string => typeof item === "string" && titles.has(item)).slice(0, 3)
      : [];
    return {
      reply: reply.slice(0, 1200),
      sources: sources.length ? sources : [ranked[0].article.title],
      suggestions: suggestionsFrom(ranked, new Set(sources), 2),
      confidence: "high",
    };
  } catch {
    return local;
  }
}
