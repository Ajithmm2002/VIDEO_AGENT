import { ERROR_GUIDES, HELP_ARTICLES, readAppWorkingMarkdown } from "@/lib/ai/app-working";
import { remoteAiEnabled } from "@/lib/env";
import { contactSupportReply, EXAMPLE_SUPPORT_EMAIL, EXAMPLE_SUPPORT_PHONE } from "@/lib/ai/support-public";

export { contactSupportReply, EXAMPLE_SUPPORT_EMAIL, EXAMPLE_SUPPORT_PHONE, SUPPORT_QUICK_PROMPTS } from "@/lib/ai/support-public";
export { ERROR_GUIDES, HELP_ARTICLES } from "@/lib/ai/app-working";

function helpCentreText() {
  return `${readAppWorkingMarkdown()}\n\nContact support: ${contactSupportReply()}`;
}

export const SUPPORT_SYSTEM = `You are the in-app support assistant for Content Studio, available 24 hours a day.

Answer from the app working guide below and from the person's question. Keep replies short (2–8 sentences). Be concrete.
When they report an error, name the likely cause and the next tap or page. Ask for the exact on-screen message if it is missing.
When they ask for a phone number, email, helpline, or customer support contact, give exactly these example details and label them as example: ${EXAMPLE_SUPPORT_EMAIL} and ${EXAMPLE_SUPPORT_PHONE}. Do not invent other emails, phones, WhatsApp numbers, or payment links.
If you do not know, say so, give the example contact, and suggest Settings, Purchases, or signing in again.
Never ask for passwords. Never claim coins are cash. Never mention internal SQL, API keys, or admin emails.
Reply in the same language the person used when you can. Return JSON only: {"reply":"..."}.

App working guide:
${helpCentreText()}`;

function haystack(question: string) {
  return question.toLowerCase();
}

function matchScore(question: string, keywords: string[]) {
  const text = haystack(question);
  return keywords.reduce((score, keyword) => {
    if (!text.includes(keyword.toLowerCase())) return score;
    return score + Math.max(1, Math.floor(keyword.length / 6));
  }, 0);
}

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
];

export function wantsContact(question: string) {
  const text = haystack(question);
  if (CONTACT_PHRASES.some((phrase) => text.includes(phrase))) return true;
  if (/\b(email|e-mail|phone|mobile|number)\b/.test(text) && /\b(support|contact|customer|helpline|reach you)\b/.test(text)) {
    return true;
  }
  if (/\bwhat(?:'s| is) (?:your |the )?(?:support )?(?:email|e-mail|phone|number)\b/.test(text)) return true;
  if (/\b(send|share|give me)\b.{0,28}\b(email|e-mail|phone|number)\b/.test(text)) return true;
  return false;
}

export function wantsErrorHelp(question: string) {
  return ERROR_GUIDES.some((guide) => matchScore(question, guide.keywords) > 0);
}

function bestScored<T extends { keywords: string[] }>(question: string, items: T[]) {
  let best: T | null = null;
  let bestScore = 0;
  for (const item of items) {
    const score = matchScore(question, item.keywords);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return { item: best, score: bestScore };
}

function rankedGuides(question: string) {
  return ERROR_GUIDES.map((guide) => ({ guide, score: matchScore(question, guide.keywords) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function localSupportReply(question: string) {
  const text = question.trim();
  if (!text) return "Write a short question about Content Studio.";

  const contact = wantsContact(text);
  const errorHits = rankedGuides(text);
  const topic = bestScored(text, HELP_ARTICLES);
  const extra = bestScored(
    text,
    HELP_ARTICLES.filter((article) => article !== topic.item),
  );
  const parts: string[] = [];

  if (errorHits.length) {
    const seen = new Set<string>();
    for (const hit of errorHits.slice(0, 2)) {
      if (seen.has(hit.guide.body)) continue;
      seen.add(hit.guide.body);
      parts.push(hit.guide.body);
    }
    if (topic.item && topic.score > 0 && !parts.includes(topic.item.body)) {
      parts.push(topic.item.body);
    }
  } else if (topic.item && topic.score > 0) {
    parts.push(topic.item.body);
    if (extra.item && extra.score >= topic.score && extra.score >= 2 && !parts.includes(extra.item.body)) {
      parts.push(extra.item.body);
    }
  }

  if (contact) parts.push(contactSupportReply());

  if (!parts.length) {
    return "I can help with Content Studio around the clock: how each page works, errors, sign-in, calendar, writing, tags, the shop, coins, and how to reach support. Tell me the page and the exact message if something failed. For a person, ask for the support email or phone — I will send the example desk.";
  }

  return parts.join("\n\n");
}

export function hasLocalSupportMatch(question: string) {
  return wantsContact(question) || wantsErrorHelp(question) || HELP_ARTICLES.some((article) => matchScore(question, article.keywords) > 0);
}

function looksLikeDetailedError(question: string) {
  return question.length > 72 || /gemini |quota|429|500|sql|stack|exception|error:/i.test(question);
}

export async function answerSupport(question: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const trimmed = question.trim().slice(0, 500);
  if (!trimmed) return "Write a short question about Content Studio.";
  const useLocal =
    wantsContact(trimmed) ||
    (hasLocalSupportMatch(trimmed) && !(remoteAiEnabled() && wantsErrorHelp(trimmed) && looksLikeDetailedError(trimmed))) ||
    !remoteAiEnabled();
  if (useLocal) return localSupportReply(trimmed);
  try {
    const { completeSupport } = await import("@/lib/ai/remote");
    const transcript = JSON.stringify({
      history: history.slice(-8).map((item) => ({ role: item.role, content: item.content.slice(0, 500) })),
      question: trimmed,
    });
    return await completeSupport(SUPPORT_SYSTEM, transcript);
  } catch {
    return localSupportReply(trimmed);
  }
}
