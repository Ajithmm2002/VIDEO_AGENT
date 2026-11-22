import { remoteAiEnabled } from "@/lib/env";

export const SUPPORT_SYSTEM = `You are the in-app support assistant for Content Studio, a private workspace for planning YouTube and Instagram videos.

Answer only about this app: sign-in, calendar, content, planner, writing, thumbnails, hashtags, marketplace, purchases, Fun mode coins, sessions, and bugs people hit while using it.
Keep replies short (2–6 sentences). Be concrete. Do not invent emails, phone numbers, or off-app payment links.
If you do not know, say so and suggest Settings, Purchases, or signing in again.
Never ask for passwords. Never claim coins are cash.
Reply in the same language the person used when you can. Return JSON only: {"reply":"..."}.

Product facts:
- Each account sees only its own rows.
- Sign in / register with email. Sessions last 14 days from sign-in, or 7 days with no visit, then the person must sign in again.
- Content holds titles, descriptions, YouTube tags, hashtags, scripts, and thumbnail prompts. Each of those fields has a copy button.
- Planner makes 1–7 day video ideas and optional audio scripts.
- Thumbnails writes English prompts for Google Flow. The app does not generate images.
- Marketplace is for buying/selling digital skills. Downloads are on Purchases. Fun mode coins: 100 coins = ₹1. Coins are an in-app reward with no cash value. Razorpay pay-with-rupees is coming soon.
- Generating drafts needs a signed-in account once Supabase is connected.
- Dark mode is a simple black layout. The site is meant to fit a phone without pinch-zooming.`;

const replies: Array<{ test: (text: string) => boolean; reply: string }> = [
  {
    test: (text) => /sign in|login|log in|password|register|account/.test(text),
    reply: "Use Sign in with your email and password, or Create an account from the login page. After 14 days, or 7 days without a visit, the app signs you out and you need to sign in again. Use Forgot password if you cannot get in.",
  },
  {
    test: (text) => /session|timeout|logged out|sign out|expire/.test(text),
    reply: "A session lasts 14 days from the last sign-in. If you do not open the app for 7 days, it also signs you out. That is normal. Sign in again to keep working.",
  },
  {
    test: (text) => /coin|fun mode|wallet|rupee|razorpay|pay/.test(text),
    reply: "Fun mode coins are an in-app reward, not money. 100 coins = ₹1 when you redeem them in the marketplace. You can earn coins in Fun mode or buy a coin pack (coming soon with Razorpay). Files you already paid for stay in Purchases.",
  },
  {
    test: (text) => /market|shop|purchase|download|skill/.test(text),
    reply: "Marketplace is only for browsing and buying. After a purchase, open Purchases to download the file. Skills are .md or .zip listings. Pay with coins, or use Buy now when rupee checkout is available.",
  },
  {
    test: (text) => /calendar|schedule|date/.test(text),
    reply: "Open Calendar to drag a content card onto a day, or pick a date on the card. On a phone, swipe the week grid sideways. Undated items sit in the list under the grid.",
  },
  {
    test: (text) => /copy|tag|hashtag|title|description|caption/.test(text),
    reply: "Title, description, caption, tag, and hashtag fields have a small copy button on the right of the label. Writing, Planner, Thumbnails, and Library also copy those texts.",
  },
  {
    test: (text) => /thumbnail|image|flow/.test(text),
    reply: "Thumbnails writes English prompts you can paste into Google Flow. This app does not create the image file. Save the prompt with a content item if you want it in the library.",
  },
  {
    test: (text) => /zoom|mobile|phone|responsive|small screen/.test(text),
    reply: "The layout is meant to fit the phone width. If a page still looks too wide, double-tap the empty background or use the browser reset-zoom control, then reload. The calendar week grid scrolls sideways on purpose.",
  },
];

export function localSupportReply(question: string) {
  const text = question.toLowerCase();
  for (const item of replies) {
    if (item.test(text)) return item.reply;
  }
  return "I can help with Content Studio: sign-in, calendar, writing, tags, the shop, coins, and common bugs. Tell me what page you are on and what went wrong. For account access, use Sign in or Forgot password. I cannot change data in your workspace from this chat.";
}

export async function answerSupport(question: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const trimmed = question.trim().slice(0, 500);
  if (!trimmed) return "Write a short question about Content Studio.";
  if (!remoteAiEnabled()) return localSupportReply(trimmed);
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
