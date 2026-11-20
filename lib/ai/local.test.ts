import { describe, expect, it } from "vitest";
import { containsMalayalam, hashtagsFor, localThumbnail, localWriting } from "@/lib/ai/local";

describe("thumbnail prompts", () => {
  it("builds landscape and vertical prompts with the required sections", () => {
    const result = localThumbnail({ topic: "Monsoon breakfast", language: "en" });
    expect(result.landscape).toContain("16:9");
    expect(result.vertical).toContain("9:16");
    for (const prompt of [result.landscape, result.vertical]) {
      expect(prompt).toContain("Subject:");
      expect(prompt).toContain("Background:");
      expect(prompt).toContain("Lighting:");
      expect(prompt).toContain("Composition:");
      expect(prompt).toContain("Colours:");
      expect(prompt).toContain("Text placement:");
      expect(prompt).toContain("Visual style:");
    }
  });

  it("quotes a Malayalam topic as on-image text", () => {
    const topic = "മഴക്കാല പ്രഭാതം";
    const result = localThumbnail({ topic, language: "ml" });
    expect(containsMalayalam(topic)).toBe(true);
    expect(result.language).toBe("ml");
    expect(result.landscape).toContain(`"${topic}"`);
    expect(result.vertical).toContain(`"${topic}"`);
    expect(result.landscape).toContain("Do not translate it.");
  });
});

describe("writing drafts", () => {
  it("returns editable English copy with hashtags", () => {
    const result = localWriting({ topic: "Home coffee", language: "en", platform: "both" });
    expect(result.titles).toHaveLength(3);
    expect(result.hook.length).toBeGreaterThan(10);
    expect(result.youtubeDescription).toContain("Home coffee");
    expect(result.instagramCaption.length).toBeGreaterThan(5);
    expect(result.scriptOutline).toContain("Hook");
    expect(result.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
    expect(result.tags.length).toBeGreaterThan(0);
  });

  it("writes Malayalam when that language is selected", () => {
    const result = localWriting({ topic: "പുസ്തക നിർദേശം", language: "ml", platform: "youtube" });
    expect(containsMalayalam(result.titles[0])).toBe(true);
    expect(result.hashtags).toContain("#Malayalam");
    expect(hashtagsFor("പുസ്തക നിർദേശം", "youtube", "ml").every((tag) => tag.startsWith("#"))).toBe(true);
  });
});
