import type {
  Category,
  ChecklistItem,
  Content,
  HashtagCollection,
  Language,
  MarketplaceListing,
  MarketplacePurchase,
  MarketplaceReview,
  Platform,
  ReferenceLink,
  Status,
  ThumbnailPromptRecord,
} from "@/lib/types";
import { REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "@/lib/shop-reviews";
import { languages, marketplaceKinds, platforms, statuses } from "@/lib/types";

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function textList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function asCategory(value: unknown): Category | null {
  const row = Array.isArray(value) ? record(value[0]) : record(value);
  if (!row || typeof row.id !== "string" || typeof row.name !== "string") return null;
  return {
    id: row.id,
    name: row.name,
    color: text(row.color),
  };
}

function asChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    if (!row || typeof row.id !== "string" || typeof row.label !== "string") return [];
    return [{ id: row.id, label: row.label, done: Boolean(row.done) }];
  });
}

function asLinks(value: unknown): ReferenceLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    if (!row || typeof row.id !== "string" || typeof row.title !== "string" || typeof row.url !== "string") {
      return [];
    }
    return [{ id: row.id, title: row.title, url: row.url }];
  });
}

export function asContent(value: unknown): Content {
  const row = record(value);
  if (!row || typeof row.id !== "string" || typeof row.title !== "string") {
    throw new Error("Content record is incomplete.");
  }
  return {
    id: row.id,
    user_id: text(row.user_id) ?? "",
    category_id: text(row.category_id),
    category: asCategory(row.categories ?? row.category),
    title: row.title,
    topic: text(row.topic),
    platform: oneOf(row.platform, platforms, "both"),
    language: oneOf(row.language, languages, "en"),
    description: text(row.description),
    youtube_description: text(row.youtube_description),
    instagram_caption: text(row.instagram_caption),
    tags: textList(row.tags),
    hashtags: textList(row.hashtags),
    script_notes: text(row.script_notes),
    thumbnail_prompt: text(row.thumbnail_prompt),
    video_url: text(row.video_url),
    published_url: text(row.published_url),
    thumbnail_path: text(row.thumbnail_path),
    planned_date: text(row.planned_date),
    status: oneOf<Status>(row.status, statuses, "idea"),
    views: numberOrNull(row.views),
    likes: numberOrNull(row.likes),
    comments: numberOrNull(row.comments),
    notes: text(row.notes),
    reference_links: asLinks(row.reference_links),
    checklist: asChecklist(row.checklist),
    is_template: Boolean(row.is_template),
    share_token: text(row.share_token),
    published_at: text(row.published_at),
    created_at: text(row.created_at) ?? "",
    updated_at: text(row.updated_at) ?? "",
  };
}

export function asCollection(value: unknown): HashtagCollection {
  const row = record(value);
  if (!row || typeof row.id !== "string" || typeof row.name !== "string") {
    throw new Error("Hashtag collection is incomplete.");
  }
  return {
    id: row.id,
    name: row.name,
    platform: platforms.includes(row.platform as Platform) ? (row.platform as Platform) : null,
    hashtags: textList(row.hashtags),
    created_at: text(row.created_at) ?? "",
  };
}

export function asListing(value: unknown): MarketplaceListing | null {
  const row = record(value);
  if (!row || typeof row.id !== "string" || typeof row.title !== "string" || typeof row.description !== "string") {
    return null;
  }
  const kind = marketplaceKinds.includes(row.kind as MarketplaceListing["kind"]) ? (row.kind as MarketplaceListing["kind"]) : "skill";
  const ext = row.file_ext === "zip" || row.file_ext === "md" ? row.file_ext : null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    offerings: textList(row.offerings).slice(0, 12),
    kind,
    price_paise: typeof row.price_paise === "number" && Number.isFinite(row.price_paise) ? row.price_paise : 0,
    currency: "INR",
    listed: Boolean(row.listed),
    file_name: text(row.file_name),
    file_ext: ext,
    created_at: text(row.created_at) ?? "",
  };
}

export function asPurchase(value: unknown): MarketplacePurchase | null {
  const row = record(value);
  if (!row || typeof row.listing_id !== "string") return null;
  const status = row.status === "paid" ? "paid" : "checkout_soon";
  return {
    listing_id: row.listing_id,
    buyer_id: typeof row.buyer_id === "string" ? row.buyer_id : undefined,
    status,
    amount_paise: typeof row.amount_paise === "number" && Number.isFinite(row.amount_paise) ? row.amount_paise : 0,
    created_at: text(row.created_at) ?? "",
  };
}

export function asReview(value: unknown): MarketplaceReview | null {
  const row = record(value);
  if (!row || typeof row.id !== "string" || typeof row.listing_id !== "string" || typeof row.reviewer_id !== "string") {
    return null;
  }
  const rating = typeof row.rating === "number" && Number.isInteger(row.rating) ? row.rating : 0;
  const body = text(row.body)?.trim() ?? "";
  if (rating < REVIEW_RATING_MIN || rating > REVIEW_RATING_MAX || body.length < REVIEW_MIN_CHARS) return null;
  return {
    id: row.id,
    listing_id: row.listing_id,
    reviewer_id: row.reviewer_id,
    rating,
    body: body.slice(0, REVIEW_MAX_CHARS),
    author_label: (text(row.author_label)?.trim() || "Customer").slice(0, 40),
    created_at: text(row.created_at) ?? "",
    updated_at: text(row.updated_at) ?? "",
  };
}

export function asPrompt(value: unknown): ThumbnailPromptRecord {
  const row = record(value);
  if (!row || typeof row.id !== "string" || typeof row.topic !== "string") {
    throw new Error("Thumbnail prompt is incomplete.");
  }
  return {
    id: row.id,
    content_id: text(row.content_id),
    topic: row.topic,
    language: oneOf<Language>(row.language, languages, "en"),
    landscape_prompt: text(row.landscape_prompt) ?? "",
    vertical_prompt: text(row.vertical_prompt) ?? "",
    created_at: text(row.created_at) ?? "",
  };
}
