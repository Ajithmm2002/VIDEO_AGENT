import { remoteAiEnabled } from "@/lib/env";

export const HELP_ARTICLES = [
  {
    title: "Sign in and accounts",
    keywords: ["sign in", "login", "log in", "password", "register", "account", "forgot"],
    body: "Use Sign in with your email and password, or Create an account. If you cannot get in, open Forgot password. After 14 days, or 7 days without a visit, the app signs you out. That is normal. Sign in again to keep working.",
  },
  {
    title: "Session length",
    keywords: ["session", "timeout", "logged out", "sign out", "expire", "days"],
    body: "A session lasts 14 days from the last sign-in. If you do not open the app for 7 days, it also signs you out. Sign in again. Your content stays on your account.",
  },
  {
    title: "Copy titles, tags, and descriptions",
    keywords: ["copy", "tag", "hashtag", "title", "description", "caption", "clipboard"],
    body: "Title, description, caption, tag, and hashtag fields have a copy button on the right of the label. Writing, Planner, Thumbnails, and Library also copy those texts. Tap or press Enter on the copy button.",
  },
  {
    title: "Calendar",
    keywords: ["calendar", "schedule", "date", "week", "month"],
    body: "Open Calendar from the Plan menu (or Menu on a phone). Drag a content card onto a day, or pick a date on the card. On a phone, swipe the week grid sideways. Undated items sit under the grid.",
  },
  {
    title: "Marketplace and Purchases",
    keywords: ["market", "shop", "purchase", "download", "skill", "buy"],
    body: "Marketplace is for browsing and buying. After a purchase, open Purchases in the Account menu to download the file. Skills are .md or .zip listings. Pay with coins, or use Buy now when rupee checkout is available.",
  },
  {
    title: "Studio coins",
    keywords: ["coin", "fun mode", "wallet", "rupee", "razorpay", "pay", "cash"],
    body: "Fun mode coins are an in-app reward, not money. 100 coins = ₹1 when you redeem them in the marketplace. Earn coins in Fun mode or buy a coin pack (Razorpay is coming soon). Files you already paid for stay in Purchases.",
  },
  {
    title: "Thumbnails",
    keywords: ["thumbnail", "image", "flow", "prompt", "picture"],
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

export const SUPPORT_QUICK_PROMPTS = [
  "How do I sign in?",
  "Where are my downloads?",
  "How do I copy tags?",
  "Why was I signed out?",
];

function helpCentreText() {
  return HELP_ARTICLES.map((article) => `${article.title}: ${article.body}`).join("\n");
}

export const SUPPORT_SYSTEM = `You are the in-app support assistant for Content Studio, available 24 hours a day.

Answer only from the help centre below and from the person's question. Keep replies short (2–6 sentences). Be concrete. Do not invent emails, phone numbers, or off-app payment links.
If you do not know, say so and suggest Settings, Purchases, or signing in again.
Never ask for passwords. Never claim coins are cash.
Reply in the same language the person used when you can. Return JSON only: {"reply":"..."}.

Help centre:
${helpCentreText()}`;

function matchScore(question: string, article: (typeof HELP_ARTICLES)[number]) {
  const text = question.toLowerCase();
  return article.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

export function localSupportReply(question: string) {
  const text = question.trim();
  if (!text) return "Write a short question about Content Studio.";
  let best = HELP_ARTICLES[0];
  let bestScore = 0;
  for (const article of HELP_ARTICLES) {
    const score = matchScore(text, article);
    if (score > bestScore) {
      best = article;
      bestScore = score;
    }
  }
  if (bestScore > 0) return best.body;
  return "I can help with Content Studio around the clock: sign-in, calendar, writing, tags, the shop, coins, and common bugs. Tell me what page you are on and what went wrong. For account access, use Sign in or Forgot password. I cannot change data in your workspace from this chat.";
}

export function hasLocalSupportMatch(question: string) {
  return HELP_ARTICLES.some((article) => matchScore(question, article) > 0);
}

export async function answerSupport(question: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const trimmed = question.trim().slice(0, 500);
  if (!trimmed) return "Write a short question about Content Studio.";
  if (hasLocalSupportMatch(trimmed) || !remoteAiEnabled()) {
    return localSupportReply(trimmed);
  }
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
