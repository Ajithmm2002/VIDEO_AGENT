"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import type { ActionResult, ContentInput } from "@/lib/types";
import { contentIdsSchema, contentSchema, firstIssue } from "@/lib/validation";

function saveError(error: { message?: string; code?: string } | null, fallback: string) {
  const message = (error?.message ?? "").toLowerCase();
  if (message.includes("https") || message.includes("url")) return "Links must start with https://";
  if (message.includes("row-level") || message.includes("permission") || error?.code === "42501") {
    return "Could not save. Sign in again, then try once more.";
  }
  if (message.includes("cardinality") || message.includes("too long") || message.includes("check")) {
    return "One of the fields is too long or has too many tags.";
  }
  if (message.includes("does not exist") || error?.code === "42P01") {
    return "The database tables are missing. Run the SQL setup file in Supabase, then try again.";
  }
  return fallback;
}

function isOwnThumbnailPath(userId: string, contentId: string, path: string) {
  const prefix = `${userId}/${contentId}/`;
  if (!path.startsWith(prefix) || path.includes("..") || path.length > 220) return false;
  const file = path.slice(prefix.length);
  return file.length > 0 && !file.includes("/") && /^[A-Za-z0-9._-]+$/.test(file);
}

function refresh() {
  revalidatePath("/", "layout");
}

function contentRow(userId: string, input: ContentInput) {
  return {
    user_id: userId,
    title: input.title,
    topic: input.topic,
    platform: input.platform,
    language: input.language,
    status: input.status,
    category_id: input.category_id,
    description: input.description,
    youtube_description: input.youtube_description,
    instagram_caption: input.instagram_caption,
    tags: input.tags,
    hashtags: input.hashtags,
    script_notes: input.script_notes,
    thumbnail_prompt: input.thumbnail_prompt,
    video_url: input.video_url,
    published_url: input.published_url,
    planned_date: input.planned_date,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    notes: input.notes,
    reference_links: input.reference_links,
    checklist: input.checklist,
    is_template: input.is_template,
  };
}

export async function saveContent(id: string | null, input: ContentInput): Promise<ActionResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;

  if (parsed.data.category_id) {
    const { data: category } = await session.supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.category_id)
      .maybeSingle();
    if (!category) return { ok: false, error: "That category is not available." };
  }

  const row = contentRow(session.user.id, parsed.data);
  if (id) {
    const { error } = await session.supabase.from("contents").update(row).eq("id", id);
    if (error) {
      console.error("saveContent update", error);
      return { ok: false, error: saveError(error, "Could not save this content.") };
    }
    refresh();
    revalidatePath(`/content/${id}`);
    return { ok: true, id, message: "Content saved." };
  }

  const { data, error } = await session.supabase.from("contents").insert(row).select("id").single();
  if (error || !data) {
    console.error("saveContent insert", error);
    return { ok: false, error: saveError(error, "Could not create this content.") };
  }
  const createdId = (data as { id: string }).id;
  refresh();
  revalidatePath(`/content/${createdId}`);
  return { ok: true, id: createdId, message: "Content created." };
}

async function copyContent(id: string, asTemplate: boolean): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { data, error } = await session.supabase
    .from("contents")
    .select(
      "category_id, title, topic, platform, language, description, youtube_description, instagram_caption, tags, hashtags, script_notes, thumbnail_prompt, video_url, notes, reference_links, checklist, planned_date",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Could not find that content." };
  const source = data as Record<string, unknown>;
  const title = String(source.title ?? "Untitled");
  const copy = {
    user_id: session.user.id,
    category_id: source.category_id,
    title: `${title} ${asTemplate ? "template" : "copy"}`.slice(0, 200),
    topic: source.topic,
    platform: source.platform,
    language: source.language,
    description: source.description,
    youtube_description: source.youtube_description,
    instagram_caption: source.instagram_caption,
    tags: source.tags,
    hashtags: source.hashtags,
    script_notes: source.script_notes,
    thumbnail_prompt: source.thumbnail_prompt,
    video_url: asTemplate ? null : source.video_url,
    published_url: null,
    thumbnail_path: null,
    planned_date: asTemplate ? null : source.planned_date,
    status: "idea",
    views: null,
    likes: null,
    comments: null,
    notes: source.notes,
    reference_links: source.reference_links,
    checklist: source.checklist,
    is_template: asTemplate,
  };
  const inserted = await session.supabase.from("contents").insert(copy).select("id").single();
  if (inserted.error || !inserted.data) return { ok: false, error: "Could not copy this content." };
  refresh();
  return { ok: true, id: (inserted.data as { id: string }).id };
}

export async function duplicateContent(id: string) {
  return copyContent(id, false);
}

export async function saveAsTemplate(id: string) {
  return copyContent(id, true);
}

export async function deleteContent(id: string): Promise<ActionResult> {
  return deleteContents([id]);
}

export async function deleteContents(ids: string[]): Promise<ActionResult> {
  const parsed = contentIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const unique = [...new Set(parsed.data.ids)];
  const existing = await session.supabase.from("contents").select("id, thumbnail_path").in("id", unique);
  if (existing.error) return { ok: false, error: "Could not delete the selected content." };
  const rows = (existing.data ?? []) as Array<{ id: string; thumbnail_path?: string | null }>;
  if (!rows.length) return { ok: false, error: "Those items could not be deleted." };
  const { error } = await session.supabase.from("contents").delete().in("id", rows.map((row) => row.id));
  if (error) return { ok: false, error: "Could not delete the selected content." };
  const paths = rows.map((row) => row.thumbnail_path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    void session.supabase.storage.from("thumbnails").remove(paths);
  }
  refresh();
  const count = rows.length;
  return { ok: true, message: count === 1 ? "Content deleted." : `${count} items deleted.` };
}

export async function updatePlannedDate(id: string, plannedDate: string | null): Promise<ActionResult> {
  if (plannedDate && !/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
    return { ok: false, error: "Use a valid date." };
  }
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase
    .from("contents")
    .update({ planned_date: plannedDate })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not move this content." };
  refresh();
  return { ok: true };
}

export async function setThumbnailPath(id: string, path: string | null): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  if (path && !isOwnThumbnailPath(session.user.id, id, path)) {
    return { ok: false, error: "That image could not be attached." };
  }
  const existing = await session.supabase.from("contents").select("thumbnail_path").eq("id", id).maybeSingle();
  const previous = (existing.data as { thumbnail_path?: string | null } | null)?.thumbnail_path;
  const { error } = await session.supabase.from("contents").update({ thumbnail_path: path }).eq("id", id);
  if (error) return { ok: false, error: "Could not save the thumbnail." };
  if (previous && previous !== path) {
    await session.supabase.storage.from("thumbnails").remove([previous]);
  }
  refresh();
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Review links, repurposing, quick ideas, and CSV import
// ---------------------------------------------------------------------------

function blankInput(partial: Partial<ContentInput> & { title: string }): ContentInput {
  return {
    topic: null,
    platform: "both",
    language: "en",
    status: "idea",
    category_id: null,
    description: null,
    youtube_description: null,
    instagram_caption: null,
    tags: [],
    hashtags: [],
    script_notes: null,
    thumbnail_prompt: null,
    video_url: null,
    published_url: null,
    planned_date: null,
    views: null,
    likes: null,
    comments: null,
    notes: null,
    reference_links: [],
    checklist: [],
    is_template: false,
    ...partial,
  };
}

async function insertMany(inputs: ContentInput[]): Promise<ActionResult & { created?: number }> {
  const session = await requireSession();
  if (!session.ok) return session;
  const rows = [];
  for (const [index, input] of inputs.entries()) {
    const parsed = contentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: `Row ${index + 1}: ${firstIssue(parsed.error)}` };
    rows.push(contentRow(session.user.id, parsed.data));
  }
  if (!rows.length) return { ok: false, error: "Nothing to add." };
  for (let start = 0; start < rows.length; start += 100) {
    const { error } = await session.supabase.from("contents").insert(rows.slice(start, start + 100));
    if (error) {
      console.error("insertMany", error);
      return { ok: false, error: saveError(error, start ? `Added ${start} items, then saving stopped.` : "Could not add these items.") };
    }
  }
  refresh();
  return { ok: true, created: rows.length, message: `Added ${rows.length} item${rows.length === 1 ? "" : "s"} to Content.` };
}

export async function createIdeas(
  ideas: Array<{ title: string; topic?: string | null; notes?: string | null; planned_date?: string | null; platform?: ContentInput["platform"] }>,
): Promise<ActionResult & { created?: number }> {
  if (!Array.isArray(ideas) || ideas.length === 0 || ideas.length > 10) return { ok: false, error: "Pick between 1 and 10 ideas." };
  return insertMany(
    ideas.map((idea) =>
      blankInput({
        title: String(idea.title ?? "").slice(0, 200),
        topic: idea.topic ? String(idea.topic).slice(0, 500) : null,
        notes: idea.notes ? String(idea.notes).slice(0, 8000) : null,
        planned_date: idea.planned_date ?? null,
        platform: idea.platform ?? "both",
        status: idea.planned_date ? "planning" : "idea",
      }),
    ),
  );
}

export async function importContentCsv(text: string): Promise<ActionResult & { created?: number; skipped?: number }> {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Choose a CSV file first." };
  if (text.length > 2_000_000) return { ok: false, error: "The file is too large. Keep it under 2 MB." };
  const { csvToContent } = await import("@/lib/csv-import");
  const preview = csvToContent(text);
  if (preview.error) return { ok: false, error: preview.error };
  if (!preview.rows.length) return { ok: false, error: "No rows with a title were found." };
  const result = await insertMany(preview.rows);
  if (!result.ok) return result;
  return {
    ...result,
    skipped: preview.skipped,
    message: `Imported ${result.created} item${result.created === 1 ? "" : "s"}${preview.skipped ? `, skipped ${preview.skipped} without a title or over the limit` : ""}.`,
  };
}

const REPURPOSE_FORMATS = [
  {
    suffix: "Short",
    platform: "youtube" as const,
    notes:
      "YouTube Short (9:16, under 60 seconds). Take the strongest moment from the main video. Hook in the first 2 seconds, one idea only, captions on screen, and end with a pointer to the full video.",
    checklist: ["Pick the best 30–60 seconds", "Reframe to 9:16", "Add on-screen captions", "Link the full video"],
  },
  {
    suffix: "Reel",
    platform: "instagram" as const,
    notes:
      "Instagram Reel (9:16, 15–60 seconds). Open with the result or the most surprising line, use trending audio if it fits, keep text inside the safe area, and write a caption with a question.",
    checklist: ["Choose the opening shot", "Add audio", "Write the caption", "Pick a cover frame"],
  },
  {
    suffix: "Carousel post",
    platform: "instagram" as const,
    notes:
      "Instagram carousel (up to 10 slides). Slide 1 is the hook, slides 2–8 are one point each, the last slide is the call to action. Good for tips and step-by-step topics.",
    checklist: ["Write the hook slide", "One point per slide", "Design the slides", "End with a call to action"],
  },
];

export async function repurposeContent(id: string): Promise<ActionResult & { created?: number }> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { data, error } = await session.supabase
    .from("contents")
    .select("title, topic, language, tags, hashtags, category_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Could not find that content." };
  const source = data as { title: string; topic: string | null; language: ContentInput["language"]; tags: string[]; hashtags: string[]; category_id: string | null };
  const base = source.title.replace(/\s+[—-]\s+(Short|Reel|Carousel post)$/i, "").slice(0, 180);
  return insertMany(
    REPURPOSE_FORMATS.map((format) =>
      blankInput({
        title: `${base} — ${format.suffix}`,
        topic: source.topic ?? base,
        platform: format.platform,
        language: source.language,
        category_id: source.category_id,
        tags: source.tags ?? [],
        hashtags: source.hashtags ?? [],
        notes: `${format.notes}\n\nRepurposed from: ${source.title}`,
        checklist: format.checklist.map((label) => ({ id: crypto.randomUUID(), label, done: false })),
      }),
    ),
  );
}

export async function createShareLink(id: string): Promise<ActionResult & { token?: string }> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { newSecretToken } = await import("@/lib/tokens");
  const token = newSecretToken();
  const { data, error } = await session.supabase.from("contents").update({ share_token: token }).eq("id", id).select("id").maybeSingle();
  if (error || !data) {
    return {
      ok: false,
      error: error && (error.code === "42703" || error.code === "PGRST204")
        ? "Run the creator tools SQL (20261126120000_creator_tools.sql) in Supabase, then try again."
        : "Could not create a review link.",
    };
  }
  revalidatePath(`/content/${id}`);
  return { ok: true, token, message: "Review link ready. Anyone with the link can read this item." };
}

export async function revokeShareLink(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("contents").update({ share_token: null }).eq("id", id);
  if (error) return { ok: false, error: "Could not turn off the review link." };
  revalidatePath(`/content/${id}`);
  return { ok: true, message: "Review link turned off." };
}
