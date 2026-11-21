import { describe, expect, it } from "vitest";
import { coinPacks, packMatchesShopRate, shopPaths } from "@/lib/coin-packs";

describe("coin packs", () => {
  it("sells packs at the in-app shop rate", () => {
    expect(coinPacks.length).toBeGreaterThan(0);
    for (const pack of coinPacks) {
      expect(packMatchesShopRate(pack)).toBe(true);
    }
  });

  it("covers earn, buy packs, redeem coins, and pay with money", () => {
    const text = shopPaths.map((item) => `${item.title} ${item.body}`).join(" ").toLowerCase();
    expect(text).toMatch(/earn coins/);
    expect(text).toMatch(/coin pack/);
    expect(text).toMatch(/redeem|spend coins/);
    expect(text).toMatch(/rupees|real money|buy the same/);
  });
});
