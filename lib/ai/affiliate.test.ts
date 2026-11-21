import { describe, expect, it } from "vitest";
import { localAffiliateAd, withCaptionCredit } from "@/lib/ai/affiliate";
import { containsMalayalam } from "@/lib/ai/local";
import { cleanListingTitle, formatListingPrice, normalizeListingPrice, priceFromJsonData } from "@/lib/listing-price";
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
      creditName: "FindByAish",
      price: "₹1807",
    });
    expect(result.title).toBe("18k gold hoop earrings");
    expect(result.postDescription.toLowerCase()).toContain("affiliate");
    expect(result.postDescription).toContain("https://example.com/gold-hoops");
    expect(result.imagePrompt.toLowerCase()).toContain("jewellery");
    expect(result.videoPrompt.toLowerCase()).toContain("orbit");
    expect(result.hashtags).toHaveLength(12);
    expect(result.hashtags.every((tag) => tag.startsWith("#") && !containsMalayalam(tag))).toBe(true);
    expect(result.postDescription).toContain("Credit: FindByAish");
    expect(result.postDescription).toContain("Price: ₹1807");
    expect(result.instagramCaption).toContain("Credit: FindByAish");
    expect(result.videoPrompt).toContain("Credit: FindByAish");
    expect(result.videoPrompt).toContain("Price: ₹1807");
    expect(result.imagePrompt.toLowerCase()).toContain("simple product");
    expect(result.imagePrompt).not.toContain("Price: ₹1807");
  });

  it("writes a professional image ad with the listing price when that option is on", () => {
    const result = localAffiliateAd({
      productType: "clothing",
      productName: "Embroidered Anarkali Kurta Set",
      productUrl: "https://example.com/kurta",
      notes: "",
      language: "en",
      platform: "instagram",
      hashtagCount: 8,
      creditName: "FindByAish",
      price: "₹1807",
      professionalImageAd: true,
    });
    expect(result.imagePrompt.toLowerCase()).toContain("advertisement");
    expect(result.imagePrompt).toContain("₹1807");
    expect(result.imagePrompt).toContain("FindByAish");
    expect(result.imagePrompt.toLowerCase()).not.toContain("simple product photograph only");
  });

  it("replaces an invented end credit with the account name and listing price", () => {
    const fixed = withCaptionCredit(
      "Soft cotton kurta.\n\nCredit: LuxeHub\nPrice: ₹999",
      "FindByAish",
      "₹1807",
      "en",
    );
    expect(fixed).toContain("Credit: FindByAish");
    expect(fixed).toContain("Price: ₹1807");
    expect(fixed).not.toContain("LuxeHub");
    expect(fixed).not.toContain("₹999");
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

describe("listing price", () => {
  it("formats rupee prices from Meesho amounts", () => {
    expect(formatListingPrice(1807, "INR")).toBe("₹1807");
    expect(normalizeListingPrice("Rs. 1,807")).toBe("₹1807");
    expect(formatListingPrice(undefined)).toBe("");
  });

  it("reads a price from product JSON-LD", () => {
    expect(
      priceFromJsonData({
        "@type": "Product",
        offers: { "@type": "Offer", price: "1807", priceCurrency: "INR" },
      }),
    ).toBe("₹1807");
  });

  it("strips marketplace suffixes from listing titles", () => {
    expect(cleanListingTitle("Embroidered Anarkali Kurta Set | Meesho")).toBe("Embroidered Anarkali Kurta Set");
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
