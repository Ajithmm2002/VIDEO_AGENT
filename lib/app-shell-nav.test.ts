import { describe, expect, it } from "vitest";
import { headerContext, usesContentSearch } from "@/lib/app-shell-nav";

describe("app shell search", () => {
  it("hides plan and topic search on the skill shop and fun mode", () => {
    expect(usesContentSearch("/marketplace")).toBe(false);
    expect(usesContentSearch("/marketplace/abc")).toBe(false);
    expect(usesContentSearch("/play")).toBe(false);
    expect(usesContentSearch("/admin/marketplace")).toBe(false);
  });

  it("keeps plan and topic search on content pages", () => {
    expect(usesContentSearch("/content")).toBe(true);
    expect(usesContentSearch("/planner")).toBe(true);
    expect(usesContentSearch("/dashboard")).toBe(true);
  });

  it("labels the shop header instead of a content search box", () => {
    expect(headerContext("/marketplace")).toBe("Skill shop");
    expect(headerContext("/play")).toBe("Fun mode");
  });
});
