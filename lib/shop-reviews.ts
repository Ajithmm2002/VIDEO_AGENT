export const REVIEW_MIN_CHARS = 8;
export const REVIEW_MAX_CHARS = 280;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

export type ReviewRatingSummary = {
  listing_id: string;
  average: number;
  count: number;
};

export function reviewerLabel(displayName: string | null | undefined) {
  const trimmed = displayName?.trim().replace(/\s+/g, " ") ?? "";
  if (!trimmed || trimmed.includes("@")) return "Customer";
  return trimmed.slice(0, 40);
}

export function clampReviewBody(value: string) {
  return value.trim().slice(0, REVIEW_MAX_CHARS);
}

export function roundRating(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(REVIEW_RATING_MAX, Math.round(value * 10) / 10);
}

export function summarizeReviews(reviews: Array<{ listing_id: string; rating: number }>): ReviewRatingSummary[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const review of reviews) {
    if (!Number.isInteger(review.rating) || review.rating < REVIEW_RATING_MIN || review.rating > REVIEW_RATING_MAX) {
      continue;
    }
    const current = buckets.get(review.listing_id) ?? { sum: 0, count: 0 };
    current.sum += review.rating;
    current.count += 1;
    buckets.set(review.listing_id, current);
  }
  return [...buckets.entries()].map(([listing_id, bucket]) => ({
    listing_id,
    average: roundRating(bucket.sum / bucket.count),
    count: bucket.count,
  }));
}

export function ratingMap(stats: ReviewRatingSummary[]) {
  return new Map(stats.map((item) => [item.listing_id, item]));
}

export function ratingLabel(stats: ReviewRatingSummary | undefined) {
  if (!stats?.count) return "No reviews yet";
  const stars = stats.average.toFixed(1);
  return stats.count === 1 ? `${stars} from 1 review` : `${stars} from ${stats.count} reviews`;
}
