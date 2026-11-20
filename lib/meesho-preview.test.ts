import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isMeeshoAffiliateShell,
  parseMeeshoAffiliateLink,
  tryMeeshoProductPreview,
} from "@/lib/meesho-preview";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "8.8.8.8", family: 4 }]),
}));

const invite =
  "https://www.meesho.com/af_invite/427789215:instagram_stories:16503086?p_id=764528642&ext_id=cn6i2q&utm_source=instagram_stories";
const collection = "https://affiliate.meesho.com/collection/MTA1MzQ4MjU6Ojo6OjphdXRvZG0=";

describe("parseMeeshoAffiliateLink", () => {
  it("reads invite links from p_id and the collection id in the path", () => {
    expect(parseMeeshoAffiliateLink(new URL(invite))).toEqual({
      collectionId: "16503086",
      collectionType: "instagram_stories",
      productId: "764528642",
    });
  });

  it("decodes affiliate collection tokens", () => {
    expect(parseMeeshoAffiliateLink(new URL(collection))).toEqual({
      collectionId: "10534825",
      collectionType: "autodm",
      productId: null,
    });
  });

  it("ignores Amazon and Flipkart pages", () => {
    expect(parseMeeshoAffiliateLink(new URL("https://www.amazon.in/dp/B0EXAMPLE"))).toBeNull();
    expect(parseMeeshoAffiliateLink(new URL("https://www.flipkart.com/item/p/itm123"))).toBeNull();
  });

  it("ignores the affiliate dashboard home page", () => {
    expect(parseMeeshoAffiliateLink(new URL("https://affiliate.meesho.com/"))).toBeNull();
  });
});

describe("isMeeshoAffiliateShell", () => {
  it("detects the Affiliate Web SPA with no listing photo", () => {
    expect(isMeeshoAffiliateShell("affiliate.meesho.com", "Affiliate Web", null)).toBe(true);
    expect(isMeeshoAffiliateShell("affiliate.meesho.com", "Kurta set", "https://images.meesho.com/a.jpg")).toBe(false);
  });
});

describe("tryMeeshoProductPreview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the listing name and photo from a collection link", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("/api/affiliate/api/v1/collection/10534825");
      expect(url).toContain("collectionType=autodm");
      return new Response(
        JSON.stringify({
          products: [
            {
              id: 764528642,
              name: "Embroidered Anarkali Kurta Set with Dupatta for Women",
              price: 1807,
              rating: 4,
              rating_count: 6,
              images: ["https://images.meesho.com/images/products/764528642/dpzgm.jpg"],
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const preview = await tryMeeshoProductPreview(new URL(collection), collection);
    expect(preview).toMatchObject({
      url: collection,
      title: "Embroidered Anarkali Kurta Set with Dupatta for Women",
      siteName: "Meesho",
      image: "https://images.meesho.com/images/products/764528642/dpzgm.jpg",
      price: "₹1807",
    });
    expect(preview?.description).toContain("₹1807");
  });

  it("picks the invite p_id from a multi-product collection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            products: [
              {
                id: 1,
                name: "Other item",
                images: ["https://images.meesho.com/images/products/1/aaa.jpg"],
              },
              {
                id: 764528642,
                name: "Embroidered Anarkali Kurta Set with Dupatta for Women",
                images: ["https://images.meesho.com/images/products/764528642/dpzgm.jpg"],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    const preview = await tryMeeshoProductPreview(new URL(invite), invite);
    expect(preview?.title).toContain("Anarkali");
    expect(preview?.url).toBe(invite);
  });

  it("does not treat the affiliate HTML shell as a product", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response("<html><title>Affiliate Web</title></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }),
    );

    await expect(tryMeeshoProductPreview(new URL(collection), collection)).rejects.toThrow(
      /Meesho listing could not be opened/,
    );
  });
});
