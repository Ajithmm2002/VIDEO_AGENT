import { describe, expect, it } from "vitest";
import { localAffiliateAd } from "@/lib/ai/affiliate";
import { containsMalayalam } from "@/lib/ai/local";
import { isBlockedHost, parsePublicHttpsUrl } from "@/lib/safe-url";

describe("affiliate ads", () => {
  it("writes a professional jewellery ad with English hashtags", () => {
    const result = localAffiliateAd({
      productType: "jewellery",
      productName: "18k gold hoop earrings",
      productUrl: "https://example.com/gold-hoops",
      notes: "lightweight, daily wear",
      language: "en",
      platform: "instagram",
      hashtagCount: 12,
    });
    expect(result.title.toLowerCase()).toContain("gold");
    expect(result.postDescription.toLowerCase()).toContain("affiliate");
    expect(result.postDescription).toContain("https://example.com/gold-hoops");
    expect(result.imagePrompt.toLowerCase()).toContain("jewellery");
    expect(result.videoPrompt.toLowerCase()).toContain("orbit");
    expect(result.hashtags).toHaveLength(12);
    expect(result.hashtags.every((tag) => tag.startsWith("#") && !containsMalayalam(tag))).toBe(true);
  });

  it("writes Malayalam copy with English hashtags for electronics", () => {
    const result = localAffiliateAd({
      productType: "electronics",
      productName: "Noise cancelling headphones",
      productUrl: "",
      notes: "",
      language: "ml",
      platform: "both",
      hashtagCount: 10,
    });
    expect(containsMalayalam(result.postDescription)).toBe(true);
    expect(result.hashtags.every((tag) => !containsMalayalam(tag))).toBe(true);
    expect(result.imagePrompt.toLowerCase()).toContain("electronics");
  });
});

describe("product link safety", () => {
  it("accepts public https product links", () => {
    expect(parsePublicHttpsUrl("https://www.amazon.in/dp/B0EXAMPLE")?.hostname).toContain("amazon");
  });

  it("rejects localhost and private hosts", () => {
    expect(parsePublicHttpsUrl("https://localhost/product")).toBeNull();
    expect(parsePublicHttpsUrl("https://127.0.0.1/product")).toBeNull();
    expect(parsePublicHttpsUrl("http://example.com/product")).toBeNull();
    expect(isBlockedHost("192.168.1.10")).toBe(true);
  });
});
