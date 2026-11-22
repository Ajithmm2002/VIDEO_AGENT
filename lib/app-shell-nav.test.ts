import { describe, expect, it } from "vitest";
import { headerContext, usesContentSearch } from "@/lib/app-shell-nav";

describe("app shell search", () => {
  it("hides plan and topic search on marketplace, purchases, and fun mode", () => {
    expect(usesContentSearch("/marketplace")).toBe(false);
    expect(usesContentSearch("/marketplace/abc")).toBe(false);
    expect(usesContentSearch("/purchases")).toBe(false);
    expect(usesContentSearch("/play")).toBe(false);
    expect(usesContentSearch("/admin/marketplace")).toBe(false);
  });

  it("keeps plan and topic search on content pages", () => {
    expect(usesContentSearch("/content")).toBe(true);
    expect(usesContentSearch("/planner")).toBe(true);
    expect(usesContentSearch("/dashboard")).toBe(true);
  });

  it("labels marketplace and purchases instead of a content search box", () => {
    expect(headerContext("/marketplace")).toBe("Marketplace");
    expect(headerContext("/purchases")).toBe("Purchases");
    expect(headerContext("/play")).toBe("Fun mode");
    expect(headerContext("/admin/marketplace")).toBe("Manage products");
    expect(headerContext("/admin/marketplace/new")).toBe("List a product");
    expect(headerContext("/admin/marketplace/abc/edit")).toBe("Edit product");
  });
});
