import { describe, expect, it } from "vitest";
import { ERROR_GUIDES, HELP_ARTICLES } from "@/lib/ai/app-working";
import { buildIndex, focusedExcerpt, rankArticles, retrievalQuery, stem, terms } from "@/lib/ai/support-engine";
import { localSupportAnswer, safeModelReply } from "@/lib/ai/support";
import { DAILY_COIN_CAP, MAX_COINS_PER_CLAIM, MIN_CLAIM_MS, COINS_PER_RUPEE } from "@/lib/game-coins";
import { SESSION_IDLE_DAYS, SESSION_MAX_AGE_DAYS } from "@/lib/session-timeout";
import { REVIEW_MAX_CHARS, REVIEW_MIN_CHARS } from "@/lib/shop-reviews";
import { coinPacks } from "@/lib/coin-packs";

const index = buildIndex([...HELP_ARTICLES, ...ERROR_GUIDES]);

function topTitle(question: string, page?: string) {
  return rankArticles(index, question, { page })[0]?.article.title;
}

// Real questions people ask, with the guide section that should answer them.
const CASES: Array<[string, string | string[]]> = [
  ["how do I reset my password", "Sign in and accounts"],
  ["I forgot my password", "Sign in and accounts"],
  ["why did it log me out", "Session length"],
  ["how long does a session last", "Session length"],
  ["where is the menu on mobile", "Finding pages on phone and desktop"],
  ["what does the dashboard show", "Dashboard"],
  ["how do I duplicate a video idea", "Content"],
  ["how do I change the status to published", "Content"],
  ["write a caption and hook for my reel", "Writing assistant"],
  ["plan 7 days of comedy videos", "Idea planner"],
  ["how do I get an audio script", "Idea planner"],
  ["how to move a video to another day", "Calendar"],
  ["schedule my post for friday", "Calendar"],
  ["what is the library", "Library"],
  ["make a 9:16 thumbnail prompt for google flow", "Thumbnail prompts"],
  ["can the app create the image file", "Thumbnail prompts"],
  ["save a hashtag collection", "Hashtags"],
  ["meesho product link ad", "Affiliate ads"],
  ["how do I buy a skill", "Marketplace"],
  ["how do I rate a product", "Ratings and reviews"],
  ["where are my downloads", "Purchases and downloads"],
  ["can I withdraw coins as cash", "Studio coins and Fun mode"],
  ["what is the daily coin limit", "Studio coins and Fun mode"],
  ["buy the pro pack", "Coin packs"],
  ["copy the tags to clipboard", "Copy titles, tags, and descriptions"],
  ["can I write in malayalam", "Languages"],
  ["how do I change my display name", "Profile"],
  ["export csv backup", "Settings"],
  ["switch to night mode", "Light and dark"],
  ["can other people see my ideas", "Privacy"],
  ["keyboard shortcut to save", "Keyboard and contrast"],
  ["it shows something went wrong", "General errors"],
  ["email or password is incorrect", "Sign-in errors"],
  ["too many attempts when signing in", "Sign-in errors"],
  ["generate failed, gemini quota error", "Generate and AI errors"],
  ["could not save my content", "Save, load, and upload errors"],
  ["thumbnail upload failed", "Save, load, and upload errors"],
  ["could not claim coins", "Shop, coins, and download errors"],
  ["download is not working", "Shop, coins, and download errors"],
  ["could not load that product link", "Copy and link errors"],
  // New creator tools.
  ["add onam video ideas", "Festival ideas"],
  ["give me a hook template", "Templates"],
  ["what does the quality score mean", "Quality score"],
  ["turn my video into a reel and a short", "Repurpose"],
  ["send a draft to my client for approval", "Review links"],
  ["how does the streak work", "Weekly goal and streak"],
  ["add my schedule to google calendar", "Calendar sync"],
  ["install the app on my phone", "Install the app"],
  ["import ideas from excel", "CSV import"],
  ["track a sponsorship payment", "Brand deals"],
  ["make a link in bio page", "Creator page and link in bio"],
  ["generate onam content for my channel", "Festival ideas"],
  ["where do I set my channel niche", "About my channel"],
  // Added after a held-out check (21 of 25 were exact before these fixes).
  ["how many coins per game", "Studio coins and Fun mode"],
  ["the copy button does nothing", ["Copy and link errors", "Copy titles, tags, and descriptions"]],
  ["the product preview would not load", "Copy and link errors"],
  ["page is blank and keeps loading", ["General errors", "Save, load, and upload errors"]],
];

describe("support retrieval accuracy", () => {
  it.each(CASES)("%s → %s", (question, expected) => {
    expect([expected].flat()).toContain(topTitle(question));
  });

  it("answers at least 95% of the question set from the right section", () => {
    const correct = CASES.filter(([question, expected]) => [expected].flat().includes(topTitle(question) ?? "")).length;
    expect(correct / CASES.length).toBeGreaterThanOrEqual(0.95);
  });
});

describe("support matching rules", () => {
  it("matches whole words, so 'stage' does not count as 'tag'", () => {
    expect(terms("stage")).not.toContain("tag");
  });

  it("stems plurals and verb forms the same way", () => {
    expect(stem("tags")).toBe(stem("tag"));
    expect(stem("downloads")).toBe(stem("download"));
    expect(stem("scheduled")).toBe("schedul");
  });

  it("prefers help pages over error guides for plain how-to questions", () => {
    expect(rankArticles(index, "how do I upload a thumbnail")[0]?.article.kind).toBe("help");
  });

  it("uses the current page to break ties on vague questions", () => {
    expect(topTitle("how does this page work", "/calendar")).toBe("Calendar");
    expect(topTitle("how does this page work", "/planner")).toBe("Idea planner");
  });

  it("carries context into short follow-up questions", () => {
    const history = [{ role: "user" as const, content: "how do I schedule on the calendar" }];
    expect(retrievalQuery("and on phone?", history)).toContain("calendar");
    expect(retrievalQuery("how do I export a csv backup", history)).toBe("how do I export a csv backup");
  });

  it("keeps answers short and in the guide's own words", () => {
    const article = HELP_ARTICLES.find((item) => item.title === "Studio coins and Fun mode")!;
    const excerpt = focusedExcerpt(article, "what is the daily cap");
    expect(excerpt).toMatch(/daily cap/i);
    expect(article.body).toContain(excerpt.split(". ")[0]);
  });
});

describe("support answers", () => {
  it("says it is not sure and offers topics instead of guessing", () => {
    const answer = localSupportAnswer("purple elephants dancing");
    expect(answer.confidence).not.toBe("high");
    expect(answer.sources).toEqual([]);
    expect(answer.suggestions.length).toBeGreaterThan(0);
  });

  it("names the guide section it answered from", () => {
    const answer = localSupportAnswer("where are my downloads");
    expect(answer.sources).toContain("Purchases and downloads");
    expect(answer.reply).toMatch(/Purchases/);
  });

  it("answers greetings without dumping a guide section", () => {
    const answer = localSupportAnswer("hello");
    expect(answer.sources).toEqual([]);
    expect(answer.reply.length).toBeLessThan(200);
  });

  it("combines an error guide with the page guide when both fit", () => {
    const answer = localSupportAnswer("generate failed on the writing page");
    expect(answer.sources[0]).toBe("Generate and AI errors");
  });

  it("gives contact details directly when asked for a phone or email", () => {
    const answer = localSupportAnswer("what is your support phone number");
    expect(answer.sources).toEqual(["Contact support"]);
    expect(answer.reply).toMatch(/^Here is the Content Studio support desk/);
  });

  it("answers both parts of a two-part question", () => {
    const answer = localSupportAnswer("my thumbnail upload failed and also how do i schedule it on the calendar");
    expect(answer.sources).toContain("Save, load, and upload errors");
    expect(answer.sources).toContain("Calendar");
  });

  it("rejects model replies that invent contact details or links", () => {
    expect(safeModelReply("Email help@studio.com for help.")).toBe(false);
    expect(safeModelReply("Call +91 98765 43210 now.")).toBe(false);
    expect(safeModelReply("Visit https://evil.example to pay.")).toBe(false);
    expect(safeModelReply("Open Purchases and tap Download.")).toBe(true);
    expect(safeModelReply("Write to support@example.com or +91 00000 00000.")).toBe(true);
  });
});

describe("guide facts match the code", () => {
  const guide = [...HELP_ARTICLES, ...ERROR_GUIDES].map((article) => article.body).join("\n");

  it("coin rules", () => {
    expect(guide).toContain(`daily cap is ${DAILY_COIN_CAP} coins`);
    expect(guide).toContain(`up to ${MAX_COINS_PER_CLAIM} coins`);
    expect(guide).toContain(`at least ${MIN_CLAIM_MS / 1000} seconds`);
    expect(guide).toContain(`${COINS_PER_RUPEE} coins = ₹1`);
  });

  it("session length", () => {
    expect(guide).toContain(`${SESSION_MAX_AGE_DAYS} days`);
    expect(guide).toContain(`${SESSION_IDLE_DAYS} days`);
  });

  it("review length", () => {
    expect(guide).toContain(`${REVIEW_MIN_CHARS} to ${REVIEW_MAX_CHARS} characters`);
  });

  it("coin packs", () => {
    for (const pack of coinPacks) {
      expect(guide).toContain(pack.label);
      expect(guide).toContain(pack.coins.toLocaleString("en-US"));
    }
  });
});
