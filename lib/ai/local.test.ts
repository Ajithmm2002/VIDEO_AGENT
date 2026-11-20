import { describe, expect, it } from "vitest";
import { containsMalayalam, hashtagsFor, localAudioScript, localContentPlan, localThumbnail, localTopicCopy, localWriting } from "@/lib/ai/local";

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

  it("can build only the selected format", () => {
    const landscapeOnly = localThumbnail({ topic: "Home coffee", language: "en", landscape: true, vertical: false });
    expect(landscapeOnly.landscape).toContain("16:9");
    expect(landscapeOnly.vertical).toBe("");
    const verticalOnly = localThumbnail({ topic: "Home coffee", language: "en", landscape: false, vertical: true });
    expect(verticalOnly.vertical).toContain("9:16");
    expect(verticalOnly.landscape).toBe("");
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
    expect(result.youtubeDescription).toContain("🔥");
    expect(result.instagramCaption.length).toBeGreaterThan(5);
    expect(result.scriptOutline).toContain("Hook");
    expect(result.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.hashtags.every((tag) => !containsMalayalam(tag))).toBe(true);
  });

  it("writes Malayalam copy with English tags and hashtags", () => {
    const result = localWriting({ topic: "പുസ്തക നിർദേശം", language: "ml", platform: "youtube" });
    expect(containsMalayalam(result.titles[0])).toBe(true);
    expect(result.youtubeDescription).toContain("🔥");
    expect(result.hashtags).toContain("#Malayalam");
    expect(result.hashtags.every((tag) => tag.startsWith("#") && !containsMalayalam(tag))).toBe(true);
    expect(result.tags.every((tag) => !containsMalayalam(tag))).toBe(true);
    expect(hashtagsFor("പുസ്തക നിർദേശം", "youtube", "ml").every((tag) => tag.startsWith("#") && !containsMalayalam(tag))).toBe(true);
  });

  it("honours requested YouTube tag and hashtag counts", () => {
    const result = localTopicCopy({
      topic: "Home coffee",
      language: "en",
      platform: "youtube",
      tagCount: 8,
      hashtagCount: 20,
    });
    expect(result.tags).toHaveLength(8);
    expect(result.hashtags).toHaveLength(20);
    expect(result.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
    expect(result.description).toContain("🔥");
    expect(result.description.length).toBeGreaterThan(10);
  });
});

describe("content plans", () => {
  it("builds one video idea per day with a how-to and a timed script", () => {
    const result = localContentPlan({
      language: "en",
      platform: "both",
      themes: ["comedy", "nostalgia"],
      description: "power cuts at home",
      count: 7,
      durationSeconds: 30,
    });
    expect(result.items).toHaveLength(7);
    expect(result.items[0].title.toLowerCase()).toContain("power cuts");
    expect(result.items.every((item) => item.description.toLowerCase().includes("how to shoot"))).toBe(true);
    expect(result.items.every((item) => item.script.includes("[0:00]"))).toBe(true);
    expect(result.items[0].durationSeconds).toBe(30);
  });

  it("writes a longer audio script for a 2 minute video than a 30 second one", () => {
    const shortScript = localAudioScript({
      title: "Power cuts at home",
      description: "Film the first reaction.",
      language: "en",
      durationSeconds: 30,
    }).script;
    const longScript = localAudioScript({
      title: "Power cuts at home",
      description: "Film the first reaction.",
      language: "en",
      durationSeconds: 120,
    }).script;
    expect(longScript.split(/\s+/).length).toBeGreaterThan(shortScript.split(/\s+/).length);
  });

  it("writes Malayalam titles from a Malayalam brief", () => {
    const result = localContentPlan({
      language: "ml",
      platform: "youtube",
      themes: ["nostalgia"],
      description: "വീട്ടിൽ കറന്റ് പോകുമ്പോൾ",
      count: 3,
      durationSeconds: 60,
    });
    expect(result.items).toHaveLength(3);
    expect(containsMalayalam(result.items[0].title)).toBe(true);
    expect(containsMalayalam(result.items[0].description)).toBe(true);
    expect(containsMalayalam(result.items[0].script)).toBe(true);
  });
});
