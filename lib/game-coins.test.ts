import { describe, expect, it } from "vitest";
import { previewGameCoins, priceInCoins } from "@/lib/game-coins";

describe("game coins", () => {
  it("gives nothing for a short round", () => {
    expect(previewGameCoins(80, 8_000)).toBe(0);
  });

  it("rewards a scoring round and caps the payout", () => {
    expect(previewGameCoins(80, 25_000)).toBeGreaterThan(0);
    expect(previewGameCoins(120, 90_000)).toBeGreaterThan(0);
    expect(previewGameCoins(20_000, 180_000)).toBe(12);
  });

  it("converts rupees to coins at 10 coins per rupee", () => {
    expect(priceInCoins(0)).toBe(0);
    expect(priceInCoins(100)).toBe(10);
    expect(priceInCoins(9900)).toBe(990);
    expect(priceInCoins(150)).toBe(15);
  });
});
