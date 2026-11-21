"use server";

import { revalidatePath } from "next/cache";
import { isMarketplaceAdmin } from "@/lib/env";
import { listingObjectPath, parseSkillUpload } from "@/lib/marketplace-file";
import { requireSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { firstIssue, marketplaceListingSchema, parseOfferings, rupeesToPaise } from "@/lib/validation";
import { newId } from "@/lib/utils";

async function requireAdmin() {
  const session = await requireSession();
  if (!session.ok) return session;
  if (!isMarketplaceAdmin(session.user.email)) {
    return { ok: false as const, error: "This admin desk is only for the shop owner." };
  }
  return session;
}

function refreshShop() {
  revalidatePath("/marketplace");
  revalidatePath("/admin/marketplace");
}

export async function saveMarketplaceListing(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session.ok) return session;

  const price = rupeesToPaise(String(formData.get("price") ?? "0"));
  if (price == null) return { ok: false, error: "Enter a price in rupees, or 0 for free." };

  const parsed = marketplaceListingSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    offerings: parseOfferings(String(formData.get("offerings") ?? "")),
    kind: String(formData.get("kind") ?? "skill"),
    price_paise: price,
    listed: String(formData.get("listed") ?? "") === "on",
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const existingId = String(formData.get("id") ?? "").trim();
  const id = existingId || newId();
  const file = formData.get("file");
  const upload = file instanceof File && file.size > 0 ? parseSkillUpload(file) : null;
  if (!existingId && !upload?.ok) {
    return { ok: false, error: upload && !upload.ok ? upload.error : "Attach a .md skill file or a .zip bundle." };
  }
  if (upload && !upload.ok) return { ok: false, error: upload.error };

  let filePath: string | undefined;
  let fileName: string | undefined;
  let fileExt: "md" | "zip" | undefined;
  if (upload?.ok) {
    filePath = listingObjectPath(id, upload.stored);
    fileName = upload.original;
    fileExt = upload.ext;
    const { error: storageError } = await session.supabase.storage
      .from("marketplace-files")
      .upload(filePath, file as File, { upsert: true, contentType: upload.ext === "zip" ? "application/zip" : "text/markdown" });
    if (storageError) {
      return {
        ok: false,
        error: "Could not store the file. Add your sign-in email to app_admins in Supabase, then try again.",
      };
    }
  }

  const row = {
    id,
    created_by: session.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    offerings: parsed.data.offerings,
    kind: parsed.data.kind,
    price_paise: parsed.data.price_paise,
    currency: "INR",
    listed: parsed.data.listed,
    ...(filePath ? { file_path: filePath, file_name: fileName, file_ext: fileExt } : {}),
  };

  const result = existingId
    ? await session.supabase.from("marketplace_listings").update(row).eq("id", id)
    : await session.supabase.from("marketplace_listings").insert(row);
  if (result.error) {
    return {
      ok: false,
      error: "Could not save the listing. Add your sign-in email to app_admins in Supabase, then try again.",
    };
  }
  refreshShop();
  revalidatePath(`/marketplace/${id}`);
  return { ok: true, message: parsed.data.listed ? "Skill is listed in the shop." : "Draft saved.", id };
}

export async function deleteMarketplaceListing(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session.ok) return session;
  const { data } = await session.supabase.from("marketplace_listings").select("file_path").eq("id", id).maybeSingle();
  const path = typeof data?.file_path === "string" ? data.file_path : null;
  if (path) await session.supabase.storage.from("marketplace-files").remove([path]);
  const { error } = await session.supabase.from("marketplace_listings").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete that listing." };
  refreshShop();
  return { ok: true, message: "Listing removed." };
}

export async function requestMarketplaceSkill(listingId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { data: listing, error: listingError } = await session.supabase
    .from("marketplace_listings")
    .select("id, listed, price_paise")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError || !listing || listing.listed !== true) {
    return { ok: false, error: "That skill is not on sale." };
  }
  const { error } = await session.supabase.from("marketplace_purchases").insert({
    listing_id: listingId,
    buyer_id: session.user.id,
    status: listing.price_paise === 0 ? "paid" : "checkout_soon",
    amount_paise: listing.price_paise,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: true, message: listing.price_paise === 0 ? "You already have this skill." : "Checkout is already on your list." };
    }
    return { ok: false, error: "Could not start checkout." };
  }
  refreshShop();
  revalidatePath(`/marketplace/${listingId}`);
  if (listing.price_paise === 0) return { ok: true, message: "This skill is now in your library." };
  return { ok: true, message: "Checkout is coming soon. We saved your interest." };
}
