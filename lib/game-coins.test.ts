import { describe, expect, it } from "vitest";
import { COIN_REWARD_HEADLINE, COIN_REWARD_TERMS, previewGameCoins, priceInCoins } from "@/lib/game-coins";

describe("game coins", () => {
  it("gives nothing for a short round", () => {
    expect(previewGameCoins(80, 8_000)).toBe(0);
  });

  it("rewards a scoring round and caps the payout", () => {
    expect(previewGameCoins(80, 25_000)).toBeGreaterThan(0);
    expect(previewGameCoins(120, 90_000)).toBeGreaterThan(0);
    expect(previewGameCoins(20_000, 180_000)).toBe(12);
  });

  it("converts rupees to coins at 100 coins per rupee", () => {
    expect(priceInCoins(0)).toBe(0);
    expect(priceInCoins(100)).toBe(100);
    expect(priceInCoins(9900)).toBe(9_900);
    expect(priceInCoins(150)).toBe(150);
  });

  it("states that coins are an in-app reward with no cash value", () => {
    expect(COIN_REWARD_HEADLINE.toLowerCase()).toContain("not money");
    const terms = COIN_REWARD_TERMS.join(" ").toLowerCase();
    expect(terms).toMatch(/earn coins/);
    expect(terms).toMatch(/coin pack/);
    expect(terms).toMatch(/redeem coins/);
    expect(terms).toMatch(/buy now|real money/);
    expect(terms).toMatch(/not transferable/);
    expect(terms).toMatch(/cash/);
    expect(terms).toMatch(/gift cards/);
    expect(terms).toMatch(/skill shop/);
  });
});
