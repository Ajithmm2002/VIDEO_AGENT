import { describe, expect, it } from "vitest";
import { previewGameCoins, priceInCoins } from "@/lib/game-coins";

describe("game coins", () => {
  it("gives nothing for a short round", () => {
    expect(previewGameCoins(80, 8_000)).toBe(0);
  });

  it("rewards a longer scoring round and caps the payout", () => {
    expect(previewGameCoins(120, 90_000)).toBeGreaterThan(0);
    expect(previewGameCoins(20_000, 90_000)).toBe(18);
  });

  it("converts rupees to coins at one coin per rupee", () => {
    expect(priceInCoins(0)).toBe(0);
    expect(priceInCoins(19900)).toBe(199);
    expect(priceInCoins(150)).toBe(2);
  });
});
