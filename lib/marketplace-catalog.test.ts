import { describe, expect, it } from "vitest";
import {
  filterMarketplaceCatalog,
  listingKindLabel,
  pickMarketplaceListing,
} from "@/lib/marketplace-catalog";
import type { MarketplaceListing } from "@/lib/types";

function listing(partial: Partial<MarketplaceListing> & Pick<MarketplaceListing, "id" | "title" | "kind">): MarketplaceListing {
  return {
    description: "A listed digital file for the shop.",
    offerings: ["Prompt pack"],
    price_paise: 9900,
    currency: "INR",
    listed: true,
    file_name: "skill.md",
    file_ext: "md",
    created_at: "2026-11-21",
    ...partial,
  };
}

const catalog = [
  listing({ id: "skill-1", title: "Hook writer", kind: "skill", offerings: ["Claude skill"] }),
  listing({
    id: "bundle-1",
    title: "Reel starter kit",
    kind: "bundle",
    file_ext: "zip",
    file_name: "kit.zip",
    description: "Zip of templates and notes.",
  }),
  listing({ id: "skill-2", title: "Caption polish", kind: "skill" }),
];

describe("marketplace catalog", () => {
  it("labels skills and other digital products", () => {
    expect(listingKindLabel("skill")).toBe("Skill");
    expect(listingKindLabel("bundle")).toBe("Digital product");
  });

  it("lists every skill and digital product by default", () => {
    expect(filterMarketplaceCatalog(catalog).map((item) => item.id)).toEqual(["skill-1", "bundle-1", "skill-2"]);
  });

  it("filters skills, digital products, owned items, and search text", () => {
    expect(filterMarketplaceCatalog(catalog, { filter: "skill" }).map((item) => item.id)).toEqual(["skill-1", "skill-2"]);
    expect(filterMarketplaceCatalog(catalog, { filter: "bundle" }).map((item) => item.id)).toEqual(["bundle-1"]);
    expect(filterMarketplaceCatalog(catalog, { filter: "owned", purchasedIds: ["bundle-1"] }).map((item) => item.id)).toEqual([
      "bundle-1",
    ]);
    expect(filterMarketplaceCatalog(catalog, { query: "reel zip" }).map((item) => item.id)).toEqual(["bundle-1"]);
  });

  it("keeps a selected listing, then falls back to the first product", () => {
    expect(pickMarketplaceListing(catalog, "bundle-1")?.id).toBe("bundle-1");
    expect(pickMarketplaceListing(catalog, "missing")?.id).toBe("skill-1");
    expect(pickMarketplaceListing([], "skill-1")).toBeNull();
  });
});
