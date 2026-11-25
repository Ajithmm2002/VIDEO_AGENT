import { z } from "zod";
import { REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "@/lib/shop-reviews";
import { affiliateProductTypes, languages, marketplaceKinds, platforms, statuses, videoDurations, type ContentInput, type VideoDuration } from "@/lib/types";
import { uniqueLimited } from "@/lib/utils";

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .refine((value) => value === null || value === "" || isHttpsUrl(value), {
    message: "Enter a valid URL starting with https://",
  })
  .transform((value) => (value ? value : null));

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value ? value : null));

export const contentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  topic: nullableText(500),
  platform: z.enum(platforms),
  language: z.enum(languages),
  status: z.enum(statuses),
  category_id: z
    .string()
    .nullable()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || z.uuid().safeParse(value).success, {
      message: "Choose a valid category",
    }),
  description: nullableText(8000),
  youtube_description: nullableText(8000),
  instagram_caption: nullableText(5000),
  tags: z
    .array(z.string().trim().min(1).max(80))
    .max(40)
    .transform((values) => uniqueLimited(values.map((value) => value.replace(/^#/, "")))),
  hashtags: z
    .array(z.string().trim().min(1).max(80))
    .max(40)
    .transform((values) =>
      uniqueLimited(
        values
          .map((value) => value.replace(/\s+/g, ""))
          .filter(Boolean)
          .map((value) => (value.startsWith("#") ? value : `#${value}`)),
      ),
    ),
  script_notes: nullableText(20000),
  thumbnail_prompt: nullableText(20000),
  video_url: optionalUrl,
  published_url: optionalUrl,
  planned_date: z
    .string()
    .nullable()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Use a valid date",
    }),
  views: z.number().int().min(0).max(2_000_000_000).nullable(),
  likes: z.number().int().min(0).max(2_000_000_000).nullable(),
  comments: z.number().int().min(0).max(2_000_000_000).nullable(),
  notes: nullableText(8000),
  reference_links: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        title: z.string().trim().min(1).max(200),
        url: z.string().trim().max(2000).refine(isHttpsUrl, "Enter a valid URL starting with https://"),
      }),
    )
    .max(30),
  checklist: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        label: z.string().trim().min(1).max(200),
        done: z.boolean(),
      }),
    )
    .max(30),
  is_template: z.boolean(),
});

export const contentIdsSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "Select at least one item.")
    .max(100, "Select up to 100 items at a time."),
});

export const affiliateRequestSchema = z
  .object({
    productType: z.enum(affiliateProductTypes),
    productName: z.string().trim().max(200).optional().default(""),
    productUrl: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .default("")
      .refine((value) => !value || isHttpsUrl(value), {
        message: "Enter a valid product URL starting with https://",
      }),
    notes: z.string().trim().max(1000).optional().default(""),
    creditName: z.string().trim().max(80).optional().default(""),
    price: z.string().trim().max(40).optional().default(""),
    professionalImageAd: z.boolean().optional().default(false),
    language: z.enum(languages),
    platform: z.enum(platforms),
    hashtagCount: z.number().int().min(5).max(30).optional().default(15),
  })
  .refine((value) => value.productName.trim().length > 0 || value.productUrl.trim().length > 0, {
    message: "Add a product name or paste a product link.",
  });

export const productPreviewSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a product link.")
    .max(2000)
    .refine(isHttpsUrl, "Enter a valid product URL starting with https://"),
});

export const thumbnailRequestSchema = z
  .object({
    topic: z.string().trim().min(1, "Enter a topic").max(500),
    title: z.string().trim().max(200).optional().default(""),
    language: z.enum(languages),
    styleNotes: z.string().trim().max(500).optional().default(""),
    landscape: z.boolean().optional().default(true),
    vertical: z.boolean().optional().default(true),
  })
  .refine((value) => value.landscape || value.vertical, {
    message: "Choose at least one thumbnail format.",
  });

export const writingRequestSchema = z.object({
  topic: z.string().trim().min(1, "Enter a topic").max(500),
  language: z.enum(languages),
  platform: z.enum(platforms),
  tone: z.string().trim().max(200).optional().default(""),
  tagCount: z.number().int().min(1).max(30).optional().default(12),
  hashtagCount: z.number().int().min(1).max(30).optional().default(15),
  title: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(4000).optional().default(""),
});

export const topicCopySchema = z.object({
  topic: z.string().trim().min(1, "Enter a topic").max(500),
  language: z.enum(languages),
  platform: z.enum(platforms),
  tagCount: z.number().int().min(1).max(30),
  hashtagCount: z.number().int().min(1).max(30),
  title: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(4000).optional().default(""),
});

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Use at least one letter and one number",
  });

export const authSchema = z.object({
  email: z.email("Enter a valid email"),
  password: passwordSchema,
  displayName: z.string().trim().min(1, "Enter your name").max(80).optional(),
});

const durationSchema = z
  .number()
  .int()
  .refine((value): value is VideoDuration => (videoDurations as readonly number[]).includes(value), {
    message: "Choose a video length.",
  });

export const planRequestSchema = z
  .object({
    language: z.enum(languages),
    platform: z.enum(platforms),
    themes: z.array(z.string().trim().min(1).max(40)).max(12),
    description: z.string().trim().max(2000),
    days: z.number().int().min(1, "Plan at least one day.").max(7, "Plans can be at most one week."),
    durationSeconds: durationSchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid start date"),
  })
  .refine((value) => value.themes.length > 0 || value.description.length > 0, {
    message: "Choose a category or write a short brief.",
  });

export const audioScriptSchema = z.object({
  title: z.string().trim().min(1, "Enter a video title").max(200),
  description: z.string().trim().max(8000),
  language: z.enum(languages),
  durationSeconds: durationSchema,
});

export const planSaveSchema = z.object({
  language: z.enum(languages),
  platform: z.enum(platforms),
  category_id: z
    .string()
    .nullable()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || z.uuid().safeParse(value).success, {
      message: "Choose a valid category",
    }),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Each idea needs a title").max(200),
        topic: z.string().trim().max(500),
        description: z.string().trim().max(8000),
        script: z.string().trim().max(20000),
        durationSeconds: durationSchema,
        planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
      }),
    )
    .min(1, "Keep at least one idea.")
    .max(7),
});

export const writingApplySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  youtube_description: nullableText(8000).optional(),
  instagram_caption: nullableText(5000).optional(),
  description: nullableText(8000).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  script_notes: nullableText(20000).optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a category name").max(60),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Choose a colour")
    .nullable(),
});

export const hashtagCollectionSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(80),
  platform: z.enum(platforms).nullable(),
  hashtags: z.array(z.string().trim().min(1).max(80)).min(1, "Add at least one hashtag").max(40),
});

export const backupSchema = z.object({
  version: z.literal(1),
  categories: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().trim().min(1).max(60),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
    }),
  ).max(200),
  contents: z.array(contentSchema.extend({ id: z.uuid() })).max(2000),
  thumbnail_prompts: z.array(
    z.object({
      id: z.uuid(),
      content_id: z.uuid().nullable(),
      topic: z.string().trim().min(1).max(500),
      language: z.enum(languages),
      landscape_prompt: z.string().trim().min(1).max(20000),
      vertical_prompt: z.string().trim().min(1).max(20000),
    }),
  ).max(2000),
  hashtag_collections: z.array(
    hashtagCollectionSchema.extend({ id: z.uuid() }),
  ).max(500),
});

export const marketplaceListingSchema = z.object({
  title: z.string().trim().min(1, "Enter a skill title").max(120),
  description: z.string().trim().min(20, "Write a short description buyers can preview.").max(8000),
  offerings: z
    .array(z.string().trim().min(1).max(80))
    .max(12)
    .transform((values) => uniqueLimited(values, 12)),
  kind: z.enum(marketplaceKinds),
  price_paise: z.number().int().min(0, "Price cannot be negative").max(100_000_000, "That price is too high"),
  listed: z.boolean(),
});

export const marketplaceReviewSchema = z.object({
  listing_id: z.uuid("That product could not be found."),
  rating: z
    .number()
    .int()
    .min(REVIEW_RATING_MIN, "Choose a star rating.")
    .max(REVIEW_RATING_MAX, "Rating is 1 to 5 stars."),
  body: z
    .string()
    .trim()
    .min(REVIEW_MIN_CHARS, `Write at least ${REVIEW_MIN_CHARS} characters.`)
    .max(REVIEW_MAX_CHARS, `Keep the review to ${REVIEW_MAX_CHARS} characters.`),
});

export function parseOfferings(value: string) {
  return uniqueLimited(
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
    12,
  );
}

export { rupeesToPaise } from "@/lib/money";

export function parseContent(input: ContentInput) {
  return contentSchema.safeParse(input);
}

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

// ---------------------------------------------------------------------------
// Creator tools
// ---------------------------------------------------------------------------

export const weeklyGoalSchema = z.number().int("Use a whole number").min(1, "Set at least 1 per week").max(21, "21 per week is the maximum");

const shortText = (max: number) => z.string().trim().max(max).default("");

export const creatorPageSchema = z.object({
  headline: shortText(280),
  niche: shortText(80),
  location: shortText(80),
  languages: shortText(80),
  contact_email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || z.email().safeParse(value).success, { message: "Enter a valid contact email" })
    .default(""),
  youtube_url: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === "" || isHttpsUrl(value), { message: "YouTube link must start with https://" })
    .default(""),
  instagram_url: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === "" || isHttpsUrl(value), { message: "Instagram link must start with https://" })
    .default(""),
  youtube_subscribers: shortText(20),
  instagram_followers: shortText(20),
  average_views: shortText(20),
  rates: z
    .array(z.object({ label: z.string().trim().min(1, "Name each rate").max(60), price: z.string().trim().max(40) }))
    .max(6, "Up to 6 rates")
    .default([]),
});

export const creatorLinkSchema = z.object({
  title: z.string().trim().min(1, "Give the link a title").max(60),
  url: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => isHttpsUrl(value), { message: "Links must start with https://" }),
});

export const brandDealSchema = z.object({
  brand: z.string().trim().min(1, "Enter the brand name").max(80),
  status: z.enum(["pitch", "negotiating", "agreed", "delivered", "paid", "lost"]),
  amount_paise: z.number().int().min(0).max(100_000_000_000).nullable(),
  due_date: z
    .string()
    .nullable()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), { message: "Use a valid date" }),
  deliverables: nullableText(1000),
  contact: nullableText(200),
  notes: nullableText(2000),
});
