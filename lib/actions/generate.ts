"use server";

import { revalidatePath } from "next/cache";
import { generateThumbnailPrompts, generateTopicCopy, generateWritingDraft } from "@/lib/ai";
import { isSupabaseConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";
import type { ActionResult, ContentInput, Language, Platform } from "@/lib/types";
import {
  contentSchema,
  firstIssue,
  thumbnailRequestSchema,
  topicCopySchema,
  writingApplySchema,
  writingRequestSchema,
} from "@/lib/validation";

async function generationAllowed() {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false as const, error: "Connect the database before generating content." };
    }
    return null;
  }
  const session = await requireSession();
  if (!session.ok) return { ok: false as const, error: "Sign in to continue." };
  return null;
}

function aiError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.startsWith("Gemini ")) return error.message;
  return fallback;
}

export async function generateThumbnails(input: {
  topic: string;
  language: Language;
  styleNotes?: string;
  landscape?: boolean;
  vertical?: boolean;
}) {
  const parsed = thumbnailRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: firstIssue(parsed.error) };
  const blocked = await generationAllowed();
  if (blocked) return blocked;
  try {
    const result = await generateThumbnailPrompts(parsed.data);
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: aiError(error, "The connected AI provider could not generate a prompt. Check the API settings.") };
  }
}

export async function generateWriting(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tone?: string;
  tagCount?: number;
  hashtagCount?: number;
  title?: string;
  notes?: string;
}) {
  const parsed = writingRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: firstIssue(parsed.error) };
  const blocked = await generationAllowed();
  if (blocked) return blocked;
  try {
    const result = await generateWritingDraft(parsed.data);
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: aiError(error, "The connected AI provider could not write a draft. Check the API settings.") };
  }
}

export async function generateFromTopic(input: {
  topic: string;
  language: Language;
  platform: Platform;
  tagCount: number;
  hashtagCount: number;
  title?: string;
  notes?: string;
}) {
  const parsed = topicCopySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: firstIssue(parsed.error) };
  const blocked = await generationAllowed();
  if (blocked) return blocked;
  try {
    const result = await generateTopicCopy(parsed.data);
    return { ok: true as const, result };
  } catch (error) {
    return { ok: false as const, error: aiError(error, "The connected AI provider could not write tags for that topic.") };
  }
}

export async function savePrompt(input: {
  topic: string;
  language: Language;
  landscape: string;
  vertical: string;
  contentId: string | null;
}): Promise<ActionResult> {
  const topic = input.topic.trim();
  const landscape = input.landscape.trim() || "Not generated.";
  const vertical = input.vertical.trim() || "Not generated.";
  if (!topic || (landscape === "Not generated." && vertical === "Not generated.")) {
    return { ok: false, error: "Generate a prompt before saving." };
  }
  if (landscape.length > 20000 || vertical.length > 20000) {
    return { ok: false, error: "That prompt is too long to save." };
  }
  const session = await requireSession();
  if (!session.ok) return session;

  if (input.contentId) {
    const { data } = await session.supabase.from("contents").select("id").eq("id", input.contentId).maybeSingle();
    if (!data) return { ok: false, error: "Choose one of your content items." };
  }

  const { error } = await session.supabase.from("thumbnail_prompts").insert({
    user_id: session.user.id,
    content_id: input.contentId,
    topic,
    language: input.language,
    landscape_prompt: landscape,
    vertical_prompt: vertical,
  });
  if (error) return { ok: false, error: "Could not save the prompt." };

  if (input.contentId) {
    const combined = [
      landscape !== "Not generated." ? `Landscape (16:9)\n${landscape}` : "",
      vertical !== "Not generated." ? `Vertical (9:16)\n${vertical}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    await session.supabase.from("contents").update({ thumbnail_prompt: combined, topic }).eq("id", input.contentId);
  }

  revalidatePath("/thumbnails");
  revalidatePath("/content");
  return { ok: true, message: "Prompt saved." };
}

export async function createFromWriting(input: ContentInput): Promise<ActionResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { data, error } = await session.supabase
    .from("contents")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not create content from this draft." };
  revalidatePath("/content");
  revalidatePath("/dashboard");
  return { ok: true, id: (data as { id: string }).id };
}

export async function applyWriting(
  contentId: string,
  fields: {
    title?: string;
    youtube_description?: string;
    instagram_caption?: string;
    tags?: string[];
    hashtags?: string[];
    script_notes?: string;
    description?: string;
  },
): Promise<ActionResult> {
  const parsed = writingApplySchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { data } = await session.supabase.from("contents").select("id").eq("id", contentId).maybeSingle();
  if (!data) return { ok: false, error: "Choose one of your content items." };
  const { error } = await session.supabase.from("contents").update(parsed.data).eq("id", contentId);
  if (error) return { ok: false, error: "Could not update that content." };
  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);
  revalidatePath("/assistant");
  return { ok: true, id: contentId, message: "Draft applied." };
}
