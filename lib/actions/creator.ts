"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { newSecretToken } from "@/lib/tokens";
import { MAX_CREATOR_LINKS, isValidHandle, normalizeHandle, type CreatorPageFields } from "@/lib/creator-page";
import type { BrandDealInput } from "@/lib/brand-deals";
import type { ActionResult } from "@/lib/types";
import { brandDealSchema, creatorLinkSchema, creatorPageSchema, firstIssue, weeklyGoalSchema } from "@/lib/validation";

const SETUP_HINT = "Run the creator tools SQL (20261126120000_creator_tools.sql) in Supabase, then try again.";

function friendly(error: { code?: string; message?: string } | null, fallback: string) {
  const message = (error?.message ?? "").toLowerCase();
  if (error?.code === "42P01" || error?.code === "42703" || error?.code === "PGRST204" || error?.code === "PGRST205" || message.includes("does not exist")) {
    return SETUP_HINT;
  }
  if (error?.code === "23505") return "That name is already taken. Try another one.";
  if (error?.code === "42501" || message.includes("row-level")) return "Sign in again, then try once more.";
  return fallback;
}

// ---------------------------------------------------------------------------
// Weekly goal and onboarding
// ---------------------------------------------------------------------------

export async function setWeeklyGoal(goal: number): Promise<ActionResult> {
  const parsed = weeklyGoalSchema.safeParse(goal);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("profiles").update({ weekly_goal: parsed.data }).eq("id", session.user.id);
  if (error) return { ok: false, error: friendly(error, "Could not save the weekly goal.") };
  revalidatePath("/dashboard");
  return { ok: true, message: `Goal set to ${parsed.data} a week.` };
}

export async function dismissOnboarding(): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase
    .from("profiles")
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq("id", session.user.id);
  if (error) return { ok: false, error: friendly(error, "Could not hide the checklist.") };
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Calendar sync
// ---------------------------------------------------------------------------

export async function createCalendarLink(): Promise<ActionResult & { token?: string }> {
  const session = await requireSession();
  if (!session.ok) return session;
  const token = newSecretToken();
  const { error } = await session.supabase.from("profiles").update({ calendar_token: token }).eq("id", session.user.id);
  if (error) return { ok: false, error: friendly(error, "Could not create a calendar link.") };
  revalidatePath("/settings");
  return { ok: true, token, message: "New calendar link ready. Any old link stops working." };
}

export async function disableCalendarLink(): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("profiles").update({ calendar_token: null }).eq("id", session.user.id);
  if (error) return { ok: false, error: friendly(error, "Could not turn off the calendar link.") };
  revalidatePath("/settings");
  return { ok: true, message: "Calendar link turned off." };
}

// ---------------------------------------------------------------------------
// Public creator page
// ---------------------------------------------------------------------------

export async function saveCreatorPage(input: { handle: string; isPublic: boolean; page: CreatorPageFields }): Promise<ActionResult> {
  const handle = normalizeHandle(input.handle);
  if (handle && !isValidHandle(handle)) {
    return { ok: false, error: "Use 3–30 lowercase letters, numbers, or underscores for your page name." };
  }
  if (input.isPublic && !handle) return { ok: false, error: "Choose a page name before you publish the page." };
  const parsed = creatorPageSchema.safeParse(input.page);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase
    .from("profiles")
    .update({ public_handle: handle || null, page_public: input.isPublic && Boolean(handle), page: parsed.data })
    .eq("id", session.user.id);
  if (error) return { ok: false, error: friendly(error, "Could not save your page.") };
  revalidatePath("/creator-page");
  if (handle) revalidatePath(`/c/${handle}`);
  return { ok: true, message: input.isPublic ? "Page saved and public." : "Page saved. It is private until you publish it." };
}

export async function addCreatorLink(input: { title: string; url: string }): Promise<ActionResult> {
  const parsed = creatorLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { count, error: countError } = await session.supabase.from("creator_links").select("id", { count: "exact", head: true });
  if (countError) return { ok: false, error: friendly(countError, "Could not add the link.") };
  if ((count ?? 0) >= MAX_CREATOR_LINKS) return { ok: false, error: `You can have up to ${MAX_CREATOR_LINKS} links.` };
  const { error } = await session.supabase
    .from("creator_links")
    .insert({ user_id: session.user.id, title: parsed.data.title, url: parsed.data.url, position: (count ?? 0) + 1 });
  if (error) return { ok: false, error: friendly(error, "Could not add the link.") };
  revalidatePath("/creator-page");
  return { ok: true, message: "Link added." };
}

export async function updateCreatorLink(id: string, input: { title: string; url: string }): Promise<ActionResult> {
  const parsed = creatorLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("creator_links").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: friendly(error, "Could not update the link.") };
  revalidatePath("/creator-page");
  return { ok: true, message: "Link updated." };
}

export async function deleteCreatorLink(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("creator_links").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error, "Could not remove the link.") };
  revalidatePath("/creator-page");
  return { ok: true, message: "Link removed." };
}

/** Save a new order for the links, top to bottom. */
export async function reorderCreatorLinks(ids: string[]): Promise<ActionResult> {
  if (!Array.isArray(ids) || ids.length > 50 || ids.some((id) => typeof id !== "string")) {
    return { ok: false, error: "Could not reorder the links." };
  }
  const session = await requireSession();
  if (!session.ok) return session;
  const results = await Promise.all(
    ids.map((id, index) => session.supabase.from("creator_links").update({ position: index + 1 }).eq("id", id)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return { ok: false, error: friendly(failed.error, "Could not reorder the links.") };
  revalidatePath("/creator-page");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Brand deals
// ---------------------------------------------------------------------------

export async function saveBrandDeal(id: string | null, input: BrandDealInput): Promise<ActionResult> {
  const parsed = brandDealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const session = await requireSession();
  if (!session.ok) return session;
  const row = { ...parsed.data, user_id: session.user.id };
  const result = id
    ? await session.supabase.from("brand_deals").update(row).eq("id", id).select("id").single()
    : await session.supabase.from("brand_deals").insert(row).select("id").single();
  if (result.error || !result.data) return { ok: false, error: friendly(result.error, "Could not save the deal.") };
  revalidatePath("/deals");
  return { ok: true, id: (result.data as { id: string }).id, message: id ? "Deal updated." : "Deal added." };
}

export async function setBrandDealStatus(id: string, status: BrandDealInput["status"]): Promise<ActionResult> {
  const parsed = brandDealSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Choose a valid stage." };
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("brand_deals").update({ status: parsed.data }).eq("id", id);
  if (error) return { ok: false, error: friendly(error, "Could not move the deal.") };
  revalidatePath("/deals");
  return { ok: true };
}

export async function deleteBrandDeal(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { error } = await session.supabase.from("brand_deals").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error, "Could not delete the deal.") };
  revalidatePath("/deals");
  return { ok: true, message: "Deal deleted." };
}
