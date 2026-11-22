"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/queries";
import { tooManyAttempts } from "@/lib/security/attempts";
import { requireSession } from "@/lib/session";
import { reviewerLabel } from "@/lib/shop-reviews";
import type { ActionResult } from "@/lib/types";
import { firstIssue, marketplaceReviewSchema } from "@/lib/validation";

function refreshProduct(listingId: string) {
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
}

export async function saveMarketplaceReview(input: {
  listingId: string;
  rating: number;
  body: string;
}): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  if (tooManyAttempts(`review:${session.user.id}`, 12, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many reviews just now. Try again in a little while." };
  }

  const parsed = marketplaceReviewSchema.safeParse({
    listing_id: input.listingId,
    rating: input.rating,
    body: input.body,
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { data: listing } = await session.supabase
    .from("marketplace_listings")
    .select("id, listed")
    .eq("id", parsed.data.listing_id)
    .maybeSingle();
  if (!listing || listing.listed !== true) {
    return { ok: false, error: "That product is not on sale." };
  }

  const { data: purchase } = await session.supabase
    .from("marketplace_purchases")
    .select("status")
    .eq("listing_id", parsed.data.listing_id)
    .eq("buyer_id", session.user.id)
    .eq("status", "paid")
    .maybeSingle();
  if (!purchase) {
    return { ok: false, error: "Buy this product before you leave a review." };
  }

  const profile = await getProfile();
  const row = {
    listing_id: parsed.data.listing_id,
    reviewer_id: session.user.id,
    rating: parsed.data.rating,
    body: parsed.data.body,
    author_label: reviewerLabel(profile?.display_name),
  };
  const { error } = await session.supabase.from("marketplace_reviews").upsert(row, {
    onConflict: "listing_id,reviewer_id",
  });
  if (error) {
    return { ok: false, error: error.message || "Could not save this review. Run the marketplace reviews SQL in Supabase." };
  }
  refreshProduct(parsed.data.listing_id);
  return { ok: true, message: "Review saved." };
}

export async function deleteMarketplaceReview(listingId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const parsed = marketplaceReviewSchema.pick({ listing_id: true }).safeParse({ listing_id: listingId });
  if (!parsed.success) return { ok: false, error: "That product could not be found." };
  const { error } = await session.supabase
    .from("marketplace_reviews")
    .delete()
    .eq("listing_id", parsed.data.listing_id)
    .eq("reviewer_id", session.user.id);
  if (error) return { ok: false, error: "Could not delete that review." };
  refreshProduct(parsed.data.listing_id);
  return { ok: true, message: "Review removed." };
}
