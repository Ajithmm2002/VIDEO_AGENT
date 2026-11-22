import { remoteAiEnabled } from "@/lib/env";

/** Placeholder desk until a live phone and inbox are set. */
export const EXAMPLE_SUPPORT_EMAIL = "support@example.com";
export const EXAMPLE_SUPPORT_PHONE = "+91 00000 00000";

export const HELP_ARTICLES = [
  {
    title: "Sign in and accounts",
    keywords: ["sign in", "login", "log in", "password", "register", "account", "forgot", "incorrect"],
    body: "Use Sign in with your email and password, or Create an account. If you cannot get in, open Forgot password. After 14 days, or 7 days without a visit, the app signs you out. That is normal. Sign in again to keep working.",
  },
  {
    title: "Session length",
    keywords: ["session", "timeout", "logged out", "sign out", "expire", "timed out"],
    body: "A session lasts 14 days from the last sign-in. If you do not open the app for 7 days, it also signs you out. Sign in again. Your content stays on your account.",
  },
  {
    title: "Copy titles, tags, and descriptions",
    keywords: ["copy", "tag", "hashtag", "title", "description", "caption", "clipboard"],
    body: "Title, description, caption, tag, and hashtag fields have a copy button on the right of the label. Writing, Planner, Thumbnails, and Library also copy those texts. Tap or press Enter on the copy button.",
  },
  {
    title: "Calendar",
    keywords: ["calendar", "schedule", "week", "month", "undated"],
    body: "Open Calendar from the Plan menu (or Menu on a phone). Drag a content card onto a day, or pick a date on the card. On a phone, swipe the week grid sideways. Undated items sit under the grid.",
  },
  {
    title: "Marketplace and Purchases",
    keywords: ["market", "shop", "purchase", "download", "skill", "buy", "checkout"],
    body: "Marketplace is for browsing and buying. After a purchase, open Purchases in the Account menu to download the file. Skills are .md or .zip listings. Pay with coins, or use Buy now when rupee checkout is available.",
  },
  {
    title: "Studio coins",
    keywords: ["coin", "fun mode", "wallet", "rupee", "razorpay", "cash"],
    body: "Fun mode coins are an in-app reward, not money. 100 coins = ₹1 when you redeem them in the marketplace. Earn coins in Fun mode or buy a coin pack (Razorpay is coming soon). Files you already paid for stay in Purchases.",
  },
  {
    title: "Thumbnails",
    keywords: ["thumbnail", "flow", "prompt", "picture"],
    body: "Thumbnails writes English prompts you paste into Google Flow. This app does not create the image file. Save the prompt with a content item if you want it in the library.",
  },
  {
    title: "Phone layout",
    keywords: ["zoom", "mobile", "phone", "responsive", "small screen", "hamburger", "menu"],
    body: "The studio is built to fit a phone. Home, Content, Shop, and Play sit on the bottom bar. Open Menu (☰) for Calendar, Writing, Settings, and the rest. Buttons are large enough to tap. The calendar week grid scrolls sideways on purpose.",
  },
  {
    title: "Writing and planner",
    keywords: ["writing", "planner", "script", "assistant", "generate", "draft"],
    body: "Writing builds titles, captions, tags, and a script outline. Planner makes 1–7 day video ideas and optional audio scripts. Generate needs a signed-in account once the database is connected. You can edit every field before you save.",
  },
  {
    title: "Keyboard and contrast",
    keywords: ["keyboard", "tab", "screen reader", "contrast", "font", "accessible", "skip"],
    body: "You can move through the studio with Tab and Enter. Skip to content jumps past the header. Text uses two sans-serif fonts at 16px or larger, with high contrast on light and dark backgrounds. Press Escape to close the menu or this chat.",
  },
];

const ERROR_GUIDES = [
  {
    title: "General errors",
    keywords: [
      "error",
      "bug",
      "broken",
      "failed",
      "fail",
      "crash",
      "not working",
      "doesn't work",
      "does not work",
      "won't work",
      "something went wrong",
      "could not",
      "cannot",
      "can't",
      "issue",
      "problem",
      "stuck",
      "blank",
      "loading",
      "try again",
      "went wrong",
    ],
    body: "If you see “Something went wrong”, tap Try again or refresh the page. Note the page name and the exact red message. Most studio errors are sign-in, Generate, save, upload, copy, shop, or a slow connection. Say which of those it is and I will give the next step. Do not send your password in this chat.",
  },
  {
    title: "Sign-in errors",
    keywords: [
      "incorrect",
      "confirm your email",
      "too many attempts",
      "reset",
      "forgot password",
      "sign in to continue",
      "timed out",
      "session timed",
      "invalid login",
    ],
    body: "“Email or password is incorrect” means the password does not match that email. Use Forgot password, then open the email link. If you just registered, confirm the email first. “Too many attempts” means wait a few minutes. “Your session timed out” or “Sign in to continue” means sign in again. Content on the account is not deleted.",
  },
  {
    title: "Generate and AI errors",
    keywords: [
      "generate",
      "gemini",
      "ai provider",
      "api settings",
      "quota",
      "busy",
      "resource_exhausted",
      "not available",
      "unknown generator",
      "incomplete",
    ],
    body: "Generate needs a signed-in account on the live site. If it says the AI provider could not write, wait a minute and tap Generate again — the model is often busy. Check you entered a topic or title first. You can still type titles, captions, and tags by hand and save. This chat cannot run Generate for you.",
  },
  {
    title: "Save, load, and upload errors",
    keywords: [
      "could not save",
      "could not load",
      "could not upload",
      "could not create",
      "could not delete",
      "could not move",
      "could not find",
      "thumbnail",
      "upload",
    ],
    body: "“Could not save” usually means the session dropped. Sign in again, then save once more. If a page will not load, refresh and check your connection. Thumbnail upload needs a normal image file; if it fails, try a smaller JPG or PNG, then save the content. Duplicate and templates need the same signed-in account.",
  },
  {
    title: "Shop, coins, and download errors",
    keywords: [
      "could not buy",
      "could not claim",
      "could not start checkout",
      "not on sale",
      "not enough",
      "wallet",
      "razorpay",
      "purchase",
      "download",
    ],
    body: "Coin redeem fails if the wallet is short, or the shop SQL is not applied on the server. Play Fun mode for at least 20 seconds before claiming coins. Downloads live in Purchases, not on the Marketplace floor. Rupee checkout and Razorpay are coming soon, so Buy now may show that it cannot start yet. Files you already bought stay in Purchases.",
  },
  {
    title: "Copy and link errors",
    keywords: ["could not copy", "clipboard", "product link", "could not load that product"],
    body: "If copy fails, select the text and copy it with your phone or browser menu — some browsers block the copy button. Affiliate “could not load that product link” means the URL is blocked or incomplete. Paste the full https link, or type the product name and generate without a preview.",
  },
];

export function contactSupportReply() {
  return `Here is the Content Studio support desk. These are example details until a live inbox and phone are set:\n\nEmail: ${EXAMPLE_SUPPORT_EMAIL}\nPhone: ${EXAMPLE_SUPPORT_PHONE}\n\nThe in-app chat stays on 24 hours a day for app questions. A human may not reply at this example address yet. Never send your password.`;
}

export const SUPPORT_QUICK_PROMPTS = [
  "Something went wrong",
  "What is the support email?",
  "Generate failed",
  "Where are my downloads?",
];

function helpCentreText() {
  return [
    ...HELP_ARTICLES.map((article) => `${article.title}: ${article.body}`),
    ...ERROR_GUIDES.map((article) => `${article.title}: ${article.body}`),
    `Contact support: ${contactSupportReply()}`,
  ].join("\n");
}

export const SUPPORT_SYSTEM = `You are the in-app support assistant for Content Studio, available 24 hours a day.

Answer from the help centre below and from the person's question. Keep replies short (2–8 sentences). Be concrete.
When they report an error, name the likely cause and the next tap or page. Ask for the exact on-screen message if it is missing.
When they ask for a phone number, email, helpline, or customer support contact, give exactly these example details and label them as example: ${EXAMPLE_SUPPORT_EMAIL} and ${EXAMPLE_SUPPORT_PHONE}. Do not invent other emails, phones, WhatsApp numbers, or payment links.
If you do not know, say so, give the example contact, and suggest Settings, Purchases, or signing in again.
Never ask for passwords. Never claim coins are cash.
Reply in the same language the person used when you can. Return JSON only: {"reply":"..."}.

Help centre:
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
  }

  if (contact) parts.push(contactSupportReply());

  if (!parts.length) {
    return "I can help with Content Studio around the clock: errors, sign-in, calendar, writing, tags, the shop, coins, and how to reach support. Tell me the page and the exact message if something failed. For a person, ask for the support email or phone — I will send the example desk.";
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
