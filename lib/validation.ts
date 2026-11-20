import { z } from "zod";
import { languages, platforms, statuses, type ContentInput } from "@/lib/types";
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

export const thumbnailRequestSchema = z.object({
  topic: z.string().trim().min(1, "Enter a topic").max(500),
  language: z.enum(languages),
  styleNotes: z.string().trim().max(500).optional().default(""),
});

export const writingRequestSchema = z.object({
  topic: z.string().trim().min(1, "Enter a topic").max(500),
  language: z.enum(languages),
  platform: z.enum(platforms),
  tone: z.string().trim().max(200).optional().default(""),
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

export function parseContent(input: ContentInput) {
  return contentSchema.safeParse(input);
}

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
