import { describe, expect, it } from "vitest";
import { contentIdsSchema, contentSchema, firstIssue, passwordSchema } from "@/lib/validation";
import { csvCell, defaultChecklist, safeNextPath } from "@/lib/utils";
import type { ContentInput } from "@/lib/types";

function sample(overrides: Partial<ContentInput> = {}): ContentInput {
  return {
    title: "A useful video",
    topic: "Useful video",
    platform: "both",
    language: "en",
    status: "idea",
    category_id: null,
    description: null,
    youtube_description: null,
    instagram_caption: null,
    tags: ["Story"],
    hashtags: ["story"],
    script_notes: null,
    thumbnail_prompt: null,
    video_url: null,
    published_url: "https://example.com/post",
    planned_date: "2026-12-01",
    views: 0,
    likes: null,
    comments: null,
    notes: null,
    reference_links: [],
    checklist: defaultChecklist(),
    is_template: false,
    ...overrides,
  };
}

describe("content validation", () => {
  it("accepts a complete content item and prefixes hashtags", () => {
    const parsed = contentSchema.safeParse(sample());
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.hashtags).toContain("#story");
  });

  it("rejects an empty title", () => {
    const parsed = contentSchema.safeParse(sample({ title: "   " }));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(firstIssue(parsed.error)).toMatch(/title/i);
  });

  it("rejects a negative view count", () => {
    const parsed = contentSchema.safeParse(sample({ views: -3 }));
    expect(parsed.success).toBe(false);
  });

  it("rejects a link that is not https", () => {
    const parsed = contentSchema.safeParse(sample({ published_url: "javascript:alert(1)" }));
    expect(parsed.success).toBe(false);
  });
});

describe("passwords and redirects", () => {
  it("requires a letter and a number", () => {
    expect(passwordSchema.safeParse("longpassword").success).toBe(false);
    expect(passwordSchema.safeParse("rainy1day").success).toBe(true);
  });

  it("keeps redirects inside the app", () => {
    expect(safeNextPath("/content")).toBe("/content");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("/%2F%2Fevil.example")).toBe("/dashboard");
  });
});

describe("content ids", () => {
  it("accepts a batch of content ids", () => {
    const parsed = contentIdsSchema.safeParse({
      ids: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty selection", () => {
    const parsed = contentIdsSchema.safeParse({ ids: [] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(firstIssue(parsed.error)).toMatch(/at least one/i);
  });
});

describe("csv", () => {
  it("quotes cells that contain commas", () => {
    expect(csvCell('Hello, "there"')).toBe('"Hello, ""there"""');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
  });
});
