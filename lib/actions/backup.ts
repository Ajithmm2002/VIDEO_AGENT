"use server";

import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { backupSchema, contentSchema, firstIssue } from "@/lib/validation";

export async function restoreBackup(raw: string): Promise<ActionResult> {
  if (raw.length > 2_000_000) return { ok: false, error: "That backup file is too large." };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "That backup does not match this app’s export format." };
  const session = await requireSession();
  if (!session.ok) return session;

  const categoryMap = new Map<string, string>();
  for (const category of parsed.data.categories) {
    const { data, error } = await session.supabase
      .from("categories")
      .insert({ user_id: session.user.id, name: category.name, color: category.color })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: `Could not restore the category “${category.name}”.` };
    categoryMap.set(category.id, (data as { id: string }).id);
  }

  const contentMap = new Map<string, string>();
  for (const content of parsed.data.contents) {
    const checked = contentSchema.safeParse({
      ...content,
      category_id: content.category_id ? categoryMap.get(content.category_id) ?? null : null,
    });
    if (!checked.success) return { ok: false, error: firstIssue(checked.error) };
    const { data, error } = await session.supabase
      .from("contents")
      .insert({ ...checked.data, user_id: session.user.id, thumbnail_path: null })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: `Could not restore “${content.title}”.` };
    contentMap.set(content.id, (data as { id: string }).id);
  }

  for (const prompt of parsed.data.thumbnail_prompts) {
    const { error } = await session.supabase.from("thumbnail_prompts").insert({
      user_id: session.user.id,
      content_id: prompt.content_id ? contentMap.get(prompt.content_id) ?? null : null,
      topic: prompt.topic,
      language: prompt.language,
      landscape_prompt: prompt.landscape_prompt,
      vertical_prompt: prompt.vertical_prompt,
    });
    if (error) return { ok: false, error: "Could not restore a thumbnail prompt." };
  }

  for (const collection of parsed.data.hashtag_collections) {
    const { error } = await session.supabase.from("hashtag_collections").insert({
      user_id: session.user.id,
      name: collection.name,
      platform: collection.platform,
      hashtags: collection.hashtags,
    });
    if (error) return { ok: false, error: "Could not restore a hashtag collection." };
  }

  return { ok: true, message: "Backup restored into your account. Existing content was left in place." };
}
