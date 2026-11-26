import { describe, expect, it } from "vitest";
import { dealTotals, type BrandDeal } from "@/lib/brand-deals";
import { CAPTION_TEMPLATES, fillTemplate } from "@/lib/caption-templates";
import { scoreContent, type ScoreInput } from "@/lib/content-score";
import { asCreatorSettings, asPage, isValidHandle, normalizeHandle } from "@/lib/creator-page";
import { csvToContent, parseCsv } from "@/lib/csv-import";
import { FESTIVALS, easterSunday, festivalDate, nextFestivalDate, suggestedPostDate, upcomingFestivals } from "@/lib/festivals";
import { weekStart, weeklyProgress } from "@/lib/goals";
import { buildCalendar, escapeIcalText, foldLine } from "@/lib/ical";
import { toCsv } from "@/lib/utils";

describe("weekly goal", () => {
  it("starts weeks on Monday in India time", () => {
    // Sunday 23:30 IST is still the old week; Monday 00:30 IST is the new one.
    expect(weekStart(new Date("2026-11-29T18:00:00Z"))).toBe("2026-11-23");
    expect(weekStart(new Date("2026-11-29T19:00:00Z"))).toBe("2026-11-30");
  });

  it("counts this week and the streak of weeks that met the goal", () => {
    const now = new Date("2026-11-26T06:00:00Z"); // Thursday
    const published = [
      "2026-11-24T05:00:00Z",
      "2026-11-25T05:00:00Z", // this week: 2
      "2026-11-17T05:00:00Z",
      "2026-11-18T05:00:00Z",
      "2026-11-19T05:00:00Z", // last week: 3
      "2026-11-10T05:00:00Z",
      "2026-11-11T05:00:00Z",
      "2026-11-12T05:00:00Z", // two weeks ago: 3
      "2026-11-03T05:00:00Z", // three weeks ago: 1, breaks the streak
    ];
    const progress = weeklyProgress(published, 3, now);
    expect(progress.thisWeek).toBe(2);
    expect(progress.remaining).toBe(1);
    expect(progress.streak).toBe(2);
    expect(progress.weeks).toHaveLength(8);
    expect(progress.weeks.at(-1)).toEqual({ start: "2026-11-23", count: 2, met: false });
  });

  it("includes this week in the streak once the goal is met", () => {
    const now = new Date("2026-11-26T06:00:00Z");
    expect(weeklyProgress(["2026-11-24T05:00:00Z", "2026-11-17T05:00:00Z"], 1, now).streak).toBe(2);
  });

  it("clamps a bad goal and ignores bad dates", () => {
    const progress = weeklyProgress(["not a date", null], 0, new Date("2026-11-26T06:00:00Z"));
    expect(progress.goal).toBe(3);
    expect(progress.thisWeek).toBe(0);
  });
});

describe("quality score", () => {
  const base: ScoreInput = {
    title: "",
    topic: null,
    platform: "both",
    description: null,
    youtube_description: null,
    instagram_caption: null,
    tags: [],
    hashtags: [],
    script_notes: null,
    thumbnail_prompt: null,
    has_thumbnail: false,
    planned_date: null,
  };

  it("scores an empty item low with fixes", () => {
    const result = scoreContent({ ...base, title: "Hi" });
    expect(result.score).toBeLessThan(20);
    expect(result.grade).toBe("Needs work");
    expect(result.checks.filter((check) => !check.passed).every((check) => check.tip.length > 10)).toBe(true);
  });

  it("scores a complete item 100", () => {
    const result = scoreContent({
      ...base,
      title: "Kerala fish curry in 10 minutes, the easy way",
      topic: "Kerala fish curry recipe",
      description: "A quick Kerala fish curry recipe with coconut milk and kudampuli. ".repeat(3),
      instagram_caption: "The easiest fish curry you will ever make. Save this for Sunday lunch!",
      tags: ["fish curry", "kerala recipe", "malayalam cooking", "coconut curry", "quick recipe"],
      hashtags: ["#fishcurry", "#keralafood", "#recipe", "#malayali", "#cooking"],
      script_notes: "Hook: the finished curry. Then the masala, the fish, and the tasting at the end.",
      has_thumbnail: true,
      planned_date: "2026-12-01",
    });
    expect(result.score).toBe(100);
    expect(result.grade).toBe("Great");
  });

  it("skips Instagram checks for a YouTube-only item", () => {
    const ids = scoreContent({ ...base, platform: "youtube", title: "x" }).checks.map((check) => check.id);
    expect(ids).not.toContain("caption");
    expect(ids).toContain("tags");
  });
});

describe("festivals", () => {
  it("calculates Easter correctly", () => {
    expect(easterSunday(2025)).toBe("2025-04-20");
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
  });

  it("calculates nth-weekday days", () => {
    expect(festivalDate({ kind: "nth-weekday", month: 5, weekday: 0, nth: 2 }, 2026)).toBe("2026-05-10"); // Mother's Day
    expect(festivalDate({ kind: "nth-weekday", month: 6, weekday: 0, nth: 3 }, 2026)).toBe("2026-06-21"); // Father's Day
  });

  it("rolls over to next year once the date has passed", () => {
    expect(nextFestivalDate({ kind: "fixed", month: 1, day: 1 }, "2026-11-26")).toBe("2027-01-01");
    expect(nextFestivalDate({ kind: "fixed", month: 12, day: 25 }, "2026-11-26")).toBe("2026-12-25");
  });

  it("never guesses a date for lunar festivals", () => {
    const onam = FESTIVALS.find((festival) => festival.id === "onam")!;
    expect(nextFestivalDate(onam.rule, "2026-11-26")).toBeNull();
  });

  it("plans posts three days ahead, but never in the past", () => {
    expect(suggestedPostDate("2026-12-25")).toBe("2026-12-22");
    expect(suggestedPostDate("2026-11-27", 3, "2026-11-26")).toBe("2026-11-26");
  });

  it("sorts dated festivals first, soonest first", () => {
    const list = upcomingFestivals("2026-11-26");
    expect(list[0].festival.id).toBe("christmas");
    expect(list.at(-1)?.date).toBeNull();
    expect(new Set(FESTIVALS.map((festival) => festival.id)).size).toBe(FESTIVALS.length);
    expect(FESTIVALS.every((festival) => festival.ideas.length >= 3)).toBe(true);
  });
});

describe("templates", () => {
  it("fills the topic and keeps other placeholders", () => {
    expect(fillTemplate("Stop making this {topic} mistake with {other}.", "biryani")).toBe("Stop making this biryani mistake with {other}.");
    expect(fillTemplate("{topic} tips", "  ")).toBe("{topic} tips");
  });

  it("has unique ids", () => {
    expect(new Set(CAPTION_TEMPLATES.map((template) => template.id)).size).toBe(CAPTION_TEMPLATES.length);
  });
});

describe("calendar feed", () => {
  it("escapes text and folds long lines", () => {
    expect(escapeIcalText("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne");
    const folded = foldLine(`SUMMARY:${"x".repeat(100)}`);
    expect(folded.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"x".repeat(100)}`);
  });

  it("writes all-day events with the next day as the end", () => {
    const ics = buildCalendar([{ id: "abc", title: "Onam sadya, explained", planned_date: "2026-08-25", status: "scheduled", platform: "both", updated_at: "2026-08-01T10:00:00Z" }]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260825");
    expect(ics).toContain("DTEND;VALUE=DATE:20260826");
    expect(ics).toContain("SUMMARY:Onam sadya\\, explained");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("CSV import", () => {
  it("parses quotes, commas, and line breaks inside quotes", () => {
    expect(parseCsv('title,notes\n"Hello, world","line 1\nline ""2"""\n')).toEqual([
      ["title", "notes"],
      ["Hello, world", 'line 1\nline "2"'],
    ]);
  });

  it("reads the studio's own export back in", () => {
    const csv = toCsv([
      ["title", "topic", "platform", "language", "status", "planned_date", "tags", "hashtags", "views"],
      ["=Formula looking title", "Topic", "youtube", "ml", "in_progress", "2026-12-01", "a b", "#x #y", 120],
    ]);
    const { rows, error } = csvToContent(csv);
    expect(error).toBeUndefined();
    expect(rows[0]).toMatchObject({
      title: "=Formula looking title",
      platform: "youtube",
      language: "ml",
      status: "in_progress",
      planned_date: "2026-12-01",
      tags: ["a", "b"],
      hashtags: ["#x", "#y"],
      views: 120,
    });
  });

  it("accepts friendly headers and Indian date order, and skips rows without a title", () => {
    const { rows, skipped } = csvToContent("Idea,Date,Language\nFirst video,05/12/2026,Malayalam\n,01/01/2027,English\n");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: "First video", planned_date: "2026-12-05", language: "ml", status: "idea" });
    expect(skipped).toBe(1);
  });

  it("explains a missing title column", () => {
    expect(csvToContent("Name\nx").error).toBeUndefined();
    expect(csvToContent("foo,bar\n1,2").error).toMatch(/title/);
  });
});

describe("creator page", () => {
  it("normalises and validates handles", () => {
    expect(normalizeHandle(" @Ajith_Vlogs ")).toBe("ajith_vlogs");
    expect(isValidHandle("ajith_vlogs")).toBe(true);
    expect(isValidHandle("ab")).toBe(false);
    expect(isValidHandle("has space")).toBe(false);
  });

  it("drops unknown fields and keeps lengths safe", () => {
    const page = asPage({ headline: "x".repeat(500), rates: [{ label: "Reel", price: "₹5,000" }, { label: "" }], evil: "<script>" });
    expect(page.headline).toHaveLength(280);
    expect(page.rates).toEqual([{ label: "Reel", price: "₹5,000" }]);
    expect(page).not.toHaveProperty("evil");
  });

  it("defaults settings safely", () => {
    expect(asCreatorSettings({ weekly_goal: 99 })).toMatchObject({ weekly_goal: 21, page_public: false, public_handle: null });
  });
});

describe("brand deal totals", () => {
  const deal = (partial: Partial<BrandDeal>): BrandDeal => ({
    id: Math.random().toString(),
    brand: "Brand",
    status: "pitch",
    amount_paise: null,
    due_date: null,
    deliverables: null,
    contact: null,
    notes: null,
    updated_at: "2026-11-20T00:00:00Z",
    ...partial,
  });

  it("sums the open pipeline, paid this month, and overdue deals", () => {
    const totals = dealTotals(
      [
        deal({ status: "agreed", amount_paise: 1_000_000, due_date: "2026-11-01" }),
        deal({ status: "pitch", amount_paise: 500_000 }),
        deal({ status: "paid", amount_paise: 300_000 }),
        deal({ status: "paid", amount_paise: 900_000, updated_at: "2026-10-01T00:00:00Z" }),
        deal({ status: "lost", amount_paise: 700_000 }),
      ],
      "2026-11-26",
    );
    expect(totals).toEqual({ openCount: 2, pipelinePaise: 1_500_000, paidThisMonthPaise: 300_000, overdue: 1 });
  });
});

describe("festival AI ideas", () => {
  it("puts the creator's niche first when AI is not connected", async () => {
    const { localFestivalIdeas } = await import("@/lib/ai/festival-ideas");
    const { asChannel } = await import("@/lib/channel-profile");
    const onam = FESTIVALS.find((festival) => festival.id === "onam")!;
    const result = localFestivalIdeas(onam, asChannel({ niche: "Home cooking" }));
    expect(result.provider).toBe("local");
    expect(result.ideas).toHaveLength(4);
    expect(result.ideas[0].title).toContain("Home cooking");
    expect(result.ideas.every((idea) => idea.hashtags.every((tag) => /^#[\p{L}\p{N}]+$/u.test(tag)))).toBe(true);
  });

  it("falls back to starter ideas without a niche", async () => {
    const { localFestivalIdeas } = await import("@/lib/ai/festival-ideas");
    const christmas = FESTIVALS.find((festival) => festival.id === "christmas")!;
    expect(localFestivalIdeas(christmas, null).ideas[0].title).toBe(christmas.ideas[0].title);
  });

  it("keeps only complete AI ideas and cleans hashtags", async () => {
    const { cleanFestivalIdeas } = await import("@/lib/ai/festival-ideas");
    const ideas = cleanFestivalIdeas({
      ideas: [
        { title: "Onam sadya in 60 seconds", hook: "Every dish, one leaf.", outline: "Top-down shot.", caption: "Which dish is yours?", hashtags: ["onam", "#Kerala Food", "ഓണം", 5] },
        { title: "", outline: "missing title" },
        "not an object",
      ],
    });
    expect(ideas).toHaveLength(1);
    expect(ideas[0].hashtags).toEqual(["#onam", "#KeralaFood"]);
    expect(cleanFestivalIdeas(null)).toEqual([]);
    const bare = cleanFestivalIdeas([{ title: "Star lantern", outline: ["Cut the frame", "Add paper", "Light it"], hashtags: [] }]);
    expect(bare[0].outline).toBe("Cut the frame\nAdd paper\nLight it");
    expect(cleanFestivalIdeas({ items: [{ title: "Carols", outline: "Film the choir." }] })).toHaveLength(1);
  });
});

describe("about my channel", () => {
  it("sanitises stored channel details", async () => {
    const { asChannel, channelIsSetUp, channelSummary } = await import("@/lib/channel-profile");
    const channel = asChannel({ niche: " Food ", language: "ml", platform: "tiktok", styles: ["Funny", "Loud", "Casual", "Informative", "Emotional"], about: "x".repeat(900) });
    expect(channel.niche).toBe("Food");
    expect(channel.platform).toBe("both");
    expect(channel.styles).toEqual(["Funny", "Casual", "Informative"]);
    expect(channel.about).toHaveLength(600);
    expect(channelIsSetUp(channel)).toBe(true);
    expect(channelIsSetUp(asChannel({}))).toBe(false);
    expect(channelSummary(channel)).toBe("Food · Malayalam · Funny, Casual, Informative");
  });
});
