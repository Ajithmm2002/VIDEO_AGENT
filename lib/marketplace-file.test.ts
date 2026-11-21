import { describe, expect, it } from "vitest";
import { formatSkillPrice, formatSkillPriceWithCoins, listingObjectPath, parseSkillUpload } from "@/lib/marketplace-file";

describe("skill uploads", () => {
  it("accepts a markdown skill file", () => {
    const file = new File(["# skill\n".repeat(4)], "hook-writer.md", { type: "text/markdown" });
    const parsed = parseSkillUpload(file);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.ext).toBe("md");
      expect(parsed.stored).toBe("skill.md");
    }
  });

  it("rejects an executable", () => {
    const file = new File(["MZ"], "skill.exe", { type: "application/octet-stream" });
    const parsed = parseSkillUpload(file);
    expect(parsed.ok).toBe(false);
  });

  it("builds a listing path", () => {
    expect(listingObjectPath("11111111-1111-1111-1111-111111111111", "skill.zip")).toBe(
      "listings/11111111-1111-1111-1111-111111111111/skill.zip",
    );
  });

  it("formats free and paid prices", () => {
    expect(formatSkillPrice(0)).toBe("Free");
    expect(formatSkillPrice(19900)).toBe("₹199");
    expect(formatSkillPriceWithCoins(0)).toBe("Free");
    expect(formatSkillPriceWithCoins(19900)).toBe("₹199 · 199 coins");
  });
});
