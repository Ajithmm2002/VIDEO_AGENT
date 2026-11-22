import { describe, expect, it } from "vitest";
import { marketplaceReviewSchema } from "@/lib/validation";
import {
  REVIEW_MAX_CHARS,
  clampReviewBody,
  ratingLabel,
  reviewerLabel,
  summarizeReviews,
} from "@/lib/shop-reviews";

describe("shop reviews", () => {
  it("hides emails and empty names", () => {
    expect(reviewerLabel("Ada")).toBe("Ada");
    expect(reviewerLabel("ada@example.com")).toBe("Customer");
    expect(reviewerLabel("  ")).toBe("Customer");
  });

  it("averages ratings per product", () => {
    const stats = summarizeReviews([
      { listing_id: "a", rating: 5 },
      { listing_id: "a", rating: 4 },
      { listing_id: "b", rating: 2 },
      { listing_id: "a", rating: 9 },
    ]);
    expect(stats.find((item) => item.listing_id === "a")).toEqual({ listing_id: "a", average: 4.5, count: 2 });
    expect(ratingLabel(stats.find((item) => item.listing_id === "b"))).toMatch(/2\.0 from 1 review/);
  });

  it("caps review text and validates length", () => {
    expect(clampReviewBody(`  ${"x".repeat(REVIEW_MAX_CHARS + 20)}  `)).toHaveLength(REVIEW_MAX_CHARS);
    expect(marketplaceReviewSchema.safeParse({ listing_id: "not-a-uuid", rating: 5, body: "Pretty good file." }).success).toBe(false);
    expect(
      marketplaceReviewSchema.safeParse({
        listing_id: "11111111-1111-4111-8111-111111111111",
        rating: 5,
        body: "short",
      }).success,
    ).toBe(false);
    expect(
      marketplaceReviewSchema.safeParse({
        listing_id: "11111111-1111-4111-8111-111111111111",
        rating: 4,
        body: "Clear prompts and easy to paste into the studio.",
      }).success,
    ).toBe(true);
  });
});
