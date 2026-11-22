import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ERROR_GUIDES, HELP_ARTICLES, parseAppWorking, readAppWorkingMarkdown } from "@/lib/ai/app-working";

describe("app working guide", () => {
  it("loads the markdown file the chatbot is trained on", () => {
    const markdown = readAppWorkingMarkdown();
    expect(markdown).toMatch(/Content Studio/);
    expect(markdown.toLowerCase()).not.toContain("ajithmmkt");
    expect(markdown).not.toMatch(/sk-|AIza|service_role/i);
  });

  it("parses help pages and error guides", () => {
    expect(HELP_ARTICLES.length).toBeGreaterThanOrEqual(15);
    expect(ERROR_GUIDES.length).toBeGreaterThanOrEqual(5);
    for (const article of [...HELP_ARTICLES, ...ERROR_GUIDES]) {
      expect(article.title.length).toBeGreaterThan(3);
      expect(article.keywords.length).toBeGreaterThan(0);
      expect(article.body.length).toBeGreaterThan(40);
    }
  });

  it("ignores sections that have no keywords", () => {
    const parsed = parseAppWorking("# Guide\n\n## Empty\nKind: help\n\nNo keywords here.\n");
    expect(parsed).toEqual([]);
  });

  it("keeps the file on disk in sync with the loader", () => {
    const fromUrl = readAppWorkingMarkdown();
    const fromCwd = readFileSync("lib/ai/app-working.md", "utf8");
    expect(fromUrl).toBe(fromCwd);
  });
});
