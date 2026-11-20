import { afterEach, describe, expect, it } from "vitest";
import { geminiFallbackModels, geminiLiteModelOrder, geminiModelOrder } from "@/lib/ai/remote";

describe("gemini model fallback", () => {
  const previous = process.env.AI_MODEL;

  afterEach(() => {
    if (previous === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = previous;
  });

  it("tries several flash and lite models", () => {
    expect(geminiFallbackModels).toContain("gemini-3.8-flash");
    expect(geminiFallbackModels).toContain("gemini-3.6-flash");
    expect(geminiFallbackModels).toContain("gemini-3.5-flash-lite");
    expect(geminiFallbackModels).toContain("gemini-3.1-flash-lite");
  });

  it("puts AI_MODEL first, then the other models", () => {
    process.env.AI_MODEL = "gemini-3.5-flash";
    expect(geminiModelOrder()[0]).toBe("gemini-3.5-flash");
    expect(geminiModelOrder()).toContain("gemini-3.8-flash");
    expect(geminiModelOrder()).toContain("gemini-3.5-flash-lite");
  });

  it("tries lite models first for thumbnails", () => {
    process.env.AI_MODEL = "gemini-3.8-flash";
    expect(geminiLiteModelOrder()[0]).toBe("gemini-3.5-flash-lite");
    expect(geminiLiteModelOrder()).toContain("gemini-3.8-flash");
  });
});
