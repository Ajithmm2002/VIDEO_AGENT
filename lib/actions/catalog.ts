"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import type { ActionResult, Platform } from "@/lib/types";
import { categorySchema, firstIssue, hashtagCollectionSchema } from "@/lib/validation";
import { uniqueLimited } from "@/lib/utils";

function refreshCatalog() {
  revalidatePath("/", "layout");
}

export async function saveCategory(id: string | null, input: { name: string; color: string | null }): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const row = { ...parsed.data, user_id: session.user.id };
  const result = id
    ? await session.supabase.from("categories").update({ name: row.name, color: row.color }).eq("id", id)
    : await session.supabase.from("categories").insert(row);
  if (result.error) {
    if (result.error.code === "23505") return { ok: false, error: "You already have a category with that name." };
    return { ok: false, error: "Could not save the category." };
  }
  refreshCatalog();
  return { ok: true, message: "Category saved." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the category." };
  refreshCatalog();
  return { ok: true };
}

export async function saveHashtagCollection(
  id: string | null,
  input: { name: string; platform: Platform | null; hashtags: string[] },
): Promise<ActionResult> {
  const parsed = hashtagCollectionSchema.safeParse({
    ...input,
    hashtags: uniqueLimited(
      input.hashtags.map((tag) => {
        const trimmed = tag.trim().replace(/\s+/g, "");
        if (!trimmed) return "";
        return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      }).filter(Boolean),
    ),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const row = { ...parsed.data, user_id: session.user.id };
  const result = id
    ? await session.supabase
        .from("hashtag_collections")
        .update({ name: row.name, platform: row.platform, hashtags: row.hashtags })
        .eq("id", id)
    : await session.supabase.from("hashtag_collections").insert(row);
  if (result.error) return { ok: false, error: "Could not save the hashtag collection." };
  refreshCatalog();
  return { ok: true, message: "Hashtag collection saved." };
}

export async function deleteHashtagCollection(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("hashtag_collections").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the collection." };
  refreshCatalog();
  return { ok: true };
}

export async function updateDisplayName(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) {
    return { ok: false, error: "Enter a name up to 80 characters." };
  }
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("profiles").update({ display_name: trimmed }).eq("id", session.user.id);
  if (error) return { ok: false, error: "Could not update your name." };
  await session.supabase.auth.updateUser({ data: { display_name: trimmed } });
  revalidatePath("/settings");
  return { ok: true, message: "Name saved." };
}
