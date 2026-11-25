"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StarRating, StarRatingInput } from "@/components/star-rating";
import { Button, Card, EmptyState, Field, TextArea } from "@/components/ui";
import { deleteMarketplaceReview, saveMarketplaceReview } from "@/lib/actions/reviews";
import { REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, ratingLabel, summarizeReviews } from "@/lib/shop-reviews";
import type { MarketplaceReview } from "@/lib/types";

export function ProductReviews({
  listingId,
  reviews,
  canReview,
  currentUserId,
}: {
  listingId: string;
  reviews: MarketplaceReview[];
  canReview: boolean;
  currentUserId: string | null;
}) {
  const mine = currentUserId ? reviews.find((item) => item.reviewer_id === currentUserId) : undefined;
  const summary = summarizeReviews(reviews)[0];

  return (
    <section className="grid gap-4" aria-labelledby="product-reviews-heading">
      <div>
        <h2 id="product-reviews-heading" className="text-xl font-semibold tracking-tight">
          Ratings and reviews
        </h2>
        <p className="mt-1 text-sm text-muted">{ratingLabel(summary)}</p>
      </div>
      {canReview ? (
        <ReviewForm listingId={listingId} existing={mine} />
      ) : (
        <p className="text-sm leading-6 text-muted">
          Buy this product to rate it and leave a short review ({REVIEW_MAX_CHARS} characters).
        </p>
      )}
      {reviews.length ? (
        <ul className="grid gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{review.author_label}</p>
                <p className="text-xs text-muted">{review.created_at.slice(0, 10)}</p>
              </div>
              <div className="mt-2">
                <StarRating value={review.rating} size="sm" />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{review.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <EmptyState title="No reviews yet" body="Customers who buy this product can rate it and write a short review." />
        </Card>
      )}
    </section>
  );
}

function ReviewForm({ listingId, existing }: { listingId: string; existing?: MarketplaceReview }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [pending, setPending] = useState(false);
  const remaining = REVIEW_MAX_CHARS - body.length;

  async function submit() {
    if (pending) return;
    setPending(true);
    try {
      const result = await saveMarketplaceReview({ listingId, rating, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Review saved.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (pending || !existing) return;
    setPending(true);
    try {
      const result = await deleteMarketplaceReview(listingId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Review removed.");
      setRating(0);
      setBody("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="grid gap-3 rounded-xl border border-line bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm font-semibold">{existing ? "Update your review" : "Write a review"}</p>
      <div className="grid gap-1.5 text-sm">
        <p className="font-medium">Rating</p>
        <StarRatingInput value={rating} onChange={setRating} />
        <p className="text-sm leading-6 text-muted">Tap 1 to 5 stars.</p>
      </div>
      <Field
        label="Review"
        hint={`${REVIEW_MIN_CHARS}–${REVIEW_MAX_CHARS} characters. ${remaining} left.`}
      >
        <TextArea
          value={body}
          maxLength={REVIEW_MAX_CHARS}
          rows={4}
          aria-describedby="review-count"
          placeholder="What should other customers know?"
          onChange={(event) => setBody(event.target.value.slice(0, REVIEW_MAX_CHARS))}
        />
      </Field>
      <p id="review-count" className="text-sm text-muted" aria-live="polite">
        {body.length}/{REVIEW_MAX_CHARS}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={pending || rating < 1}>
          {existing ? "Save review" : "Post review"}
        </Button>
        {existing ? (
          <Button type="button" variant="secondary" loading={pending} onClick={() => void remove()}>
            Remove
          </Button>
        ) : null}
      </div>
    </form>
  );
}
