import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asCategory, asCollection, asContent, asListing, asPrompt, asPurchase, asReview } from "@/lib/records";
import { attachListingsToPurchases } from "@/lib/marketplace-catalog";
import { clampWalletCoins, WELCOME_BONUS_EMAIL, type GameWallet } from "@/lib/game-coins";
import { summarizeReviews, type ReviewRatingSummary } from "@/lib/shop-reviews";
import type { Content, ContentOption, MarketplaceListing, MarketplacePurchase, MarketplaceReview, Status } from "@/lib/types";
import { statuses } from "@/lib/types";
import { sanitizeSearch } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { requestUserEmail } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { asBrandDeal, type BrandDeal } from "@/lib/brand-deals";
import { asChannel, type ChannelProfile } from "@/lib/channel-profile";
import {
  asCreatorSettings,
  asPublicPage,
  isValidHandle,
  normalizeHandle,
  type CreatorLink,
  type CreatorSettings,
  type PublicCreatorPage,
} from "@/lib/creator-page";

function parseContents(rows: unknown[]) {
  return (rows ?? []).flatMap((row) => {
    try {
      return [asContent(row)];
    } catch (error) {
      console.error("Skipped a content row that could not be read.", error);
      return [];
    }
  });
}

async function attachCategories(supabase: SupabaseClient, rows: unknown[]) {
  const contents = parseContents(rows);
  const ids = [...new Set(contents.map((item) => item.category_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return contents;
  const { data } = await supabase.from("categories").select("id, name, color").in("id", ids);
  const map = new Map(
    (data ?? []).flatMap((row) => {
      const category = asCategory(row);
      return category ? [[category.id, category] as const] : [];
    }),
  );
  return contents.map((item) => ({
    ...item,
    category: item.category_id ? map.get(item.category_id) ?? null : null,
  }));
}

const client = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  return createClient();
});

export const listCategories = cache(async () => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("categories").select("id, name, color").order("name");
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const category = asCategory(row);
    return category ? [category] : [];
  });
});

export const listCollections = cache(async () => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hashtag_collections")
    .select("id, name, platform, hashtags, created_at")
    .order("name");
  if (error) throw new Error("Could not load hashtag collections.");
  return (data ?? []).map(asCollection);
});

export const listContentOptions = cache(async (): Promise<ContentOption[]> => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contents")
    .select("id, title, language, topic")
    .eq("is_template", false)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load content.");
  return (data ?? []).flatMap((row) => {
    const record = row as { id?: string; title?: string; language?: string; topic?: string | null };
    if (!record.id || !record.title) return [];
    const language = record.language === "ml" ? "ml" as const : record.language === "en" ? "en" as const : undefined;
    return [{
      id: record.id,
      title: record.title,
      language,
      topic: record.topic ?? null,
    }];
  });
});

export type ContentFilters = {
  q?: string;
  platform?: string;
  language?: string;
  status?: string;
  category?: string;
  sort?: string;
  templates?: string;
};

const cardSelect =
  "id, user_id, category_id, title, topic, platform, language, planned_date, status, checklist, is_template, created_at, updated_at";
const librarySelect =
  "id, user_id, category_id, title, topic, platform, language, description, youtube_description, instagram_caption, video_url, published_url, thumbnail_path, thumbnail_prompt, notes, reference_links, planned_date, status, is_template, created_at, updated_at";

export async function listContents(filters: ContentFilters) {
  const supabase = await client();
  if (!supabase) return [];
  let query = supabase.from("contents").select(cardSelect);
  const q = sanitizeSearch(filters.q ?? "");
  if (q) {
    query = query.or(`title.ilike.%${q}%,topic.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (filters.platform === "youtube" || filters.platform === "instagram" || filters.platform === "both") {
    query = query.eq("platform", filters.platform);
  }
  if (filters.language === "en" || filters.language === "ml") query = query.eq("language", filters.language);
  if (statuses.includes(filters.status as Status)) query = query.eq("status", filters.status as Status);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.templates === "only") query = query.eq("is_template", true);
  else if (filters.templates !== "all") query = query.eq("is_template", false);

  const sort = filters.sort ?? "updated";
  if (sort === "title") query = query.order("title", { ascending: true });
  else if (sort === "planned") query = query.order("planned_date", { ascending: true, nullsFirst: false });
  else if (sort === "status") query = query.order("status", { ascending: true });
  else query = query.order("updated_at", { ascending: false });

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("listContents", error);
    throw new Error("Could not load content.");
  }
  return attachCategories(supabase, data ?? []);
}

export const getContent = cache(async (id: string) => {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase.from("contents").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getContent", error);
    throw new Error("Could not load this content.");
  }
  if (!data) return null;
  const [content] = await attachCategories(supabase, [data]);
  return content ?? null;
});

export const signedThumbnailUrl = cache(async (path: string | null) => {
  if (!path) return null;
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.storage.from("thumbnails").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
});

export async function signedThumbnailMap(contents: Content[]) {
  const paths = contents.flatMap((item) => (item.thumbnail_path ? [item.thumbnail_path] : []));
  if (!paths.length) return new Map<string, string>();
  const supabase = await client();
  if (!supabase) return new Map<string, string>();
  const { data } = await supabase.storage.from("thumbnails").createSignedUrls(paths, 60 * 60);
  const map = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

export const dashboardData = cache(async () => {
  const supabase = await client();
  const empty = {
    total: 0,
    drafts: 0,
    ready: 0,
    scheduled: 0,
    published: 0,
    youtube: 0,
    instagram: 0,
    recent: [] as Content[],
    upcoming: [] as Content[],
  };
  if (!supabase) return empty;

  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date());
  const cardFields = "id, title, status, planned_date, updated_at, checklist";

  const [statsResult, recentResult, upcomingResult] = await Promise.all([
    supabase.from("contents").select("status, platform", { count: "exact" }).eq("is_template", false),
    supabase
      .from("contents")
      .select(cardFields)
      .eq("is_template", false)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("contents")
      .select(cardFields)
      .eq("is_template", false)
      .gte("planned_date", today)
      .neq("status", "published")
      .order("planned_date", { ascending: true })
      .limit(6),
  ]);

  const error = statsResult.error ?? recentResult.error ?? upcomingResult.error;
  if (error) {
    console.error("dashboardData", error);
    throw new Error("Could not load the dashboard.");
  }

  const stats = (statsResult.data ?? []) as Array<{ status?: string; platform?: string }>;
  const drafts = stats.filter((item) => item.status === "idea" || item.status === "planning" || item.status === "in_progress").length;
  const ready = stats.filter((item) => item.status === "ready").length;
  const scheduled = stats.filter((item) => item.status === "scheduled").length;
  const published = stats.filter((item) => item.status === "published").length;
  const youtube = stats.filter((item) => item.platform === "youtube" || item.platform === "both").length;
  const instagram = stats.filter((item) => item.platform === "instagram" || item.platform === "both").length;

  return {
    total: statsResult.count ?? stats.length,
    drafts,
    ready,
    scheduled,
    published,
    youtube,
    instagram,
    recent: parseContents(recentResult.data ?? []),
    upcoming: parseContents(upcomingResult.data ?? []),
  };
});

export async function calendarContents(start: string, end: string, platform?: string, status?: string) {
  const supabase = await client();
  if (!supabase) return { dated: [] as Content[], undated: [] as Content[] };
  let dated = supabase
    .from("contents")
    .select(cardSelect)
    .eq("is_template", false)
    .gte("planned_date", start)
    .lte("planned_date", end);
  let undated = supabase
    .from("contents")
    .select(cardSelect)
    .eq("is_template", false)
    .is("planned_date", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (platform === "youtube" || platform === "instagram" || platform === "both") {
    dated = dated.eq("platform", platform);
    undated = undated.eq("platform", platform);
  }
  if (statuses.includes(status as Status)) {
    dated = dated.eq("status", status as Status);
    undated = undated.eq("status", status as Status);
  }

  const [datedResult, undatedResult] = await Promise.all([dated, undated]);
  if (datedResult.error || undatedResult.error) {
    console.error("calendarContents", datedResult.error ?? undatedResult.error);
    throw new Error("Could not load the calendar.");
  }
  const datedRows = datedResult.data ?? [];
  const all = await attachCategories(supabase, [...datedRows, ...(undatedResult.data ?? [])]);
  const datedIds = new Set(datedRows.map((row) => (row as { id?: string }).id).filter(Boolean));
  return {
    dated: all.filter((item) => datedIds.has(item.id)),
    undated: all.filter((item) => !datedIds.has(item.id)),
  };
}

export async function libraryContents() {
  const supabase = await client();
  if (!supabase) return [] as Content[];
  const { data, error } = await supabase
    .from("contents")
    .select(librarySelect)
    .eq("is_template", false)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("libraryContents", error);
    throw new Error("Could not load the library.");
  }
  return attachCategories(supabase, data ?? []);
}

export const getProfile = cache(async () => {
  const supabase = await client();
  if (!supabase) return null;
  // Row Level Security only returns the signed-in person's own profile row,
  // so this skips a separate auth round trip. proxy.ts has already checked the session.
  const { data } = await supabase.from("profiles").select("id, display_name").maybeSingle();
  const row = data as { id?: string; display_name?: string | null } | null;
  if (!row?.id) return null;
  return { id: row.id, display_name: row.display_name ?? null };
});

const loadMarketplaceListings = cache(async (includeDrafts: boolean) => {
  const supabase = await client();
  if (!supabase) return [] as MarketplaceListing[];
  let query = supabase
    .from("marketplace_listings")
    .select("id, title, description, offerings, kind, price_paise, currency, listed, file_name, file_ext, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (!includeDrafts) query = query.eq("listed", true);
  const { data, error } = await query;
  if (error) {
    console.error("listMarketplaceListings", error);
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const listing = asListing(row);
    return listing ? [listing] : [];
  });
});

export function listMarketplaceListings(options: { includeDrafts?: boolean } = {}) {
  return loadMarketplaceListings(Boolean(options.includeDrafts));
}

export const getMarketplaceListing = cache(async (id: string) => {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, title, description, offerings, kind, price_paise, currency, listed, file_name, file_ext, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return asListing(data);
});

export const getGameWallet = cache(async (): Promise<GameWallet> => {
  const supabase = await client();
  if (!supabase) return { coins: 0, earned: 0 };
  const [{ data, error }, email] = await Promise.all([
    supabase.from("game_wallets").select("coins, earned, welcome_bonus_at").maybeSingle(),
    requestUserEmail(),
  ]);
  if (error) {
    const { data: fallback } = await supabase.from("game_wallets").select("coins").maybeSingle();
    const coins = clampWalletCoins(fallback?.coins);
    return { coins, earned: coins };
  }
  // The welcome bonus is granted once; only ask for it while it has not been given yet.
  if (email?.trim().toLowerCase() === WELCOME_BONUS_EMAIL && !data?.welcome_bonus_at) {
    const { data: granted } = await supabase.rpc("grant_welcome_bonus");
    const row = granted as { ok?: boolean; balance?: number; earned?: number } | null;
    if (row?.ok) {
      const coins = clampWalletCoins(row.balance);
      return { coins, earned: Math.max(coins, clampWalletCoins(row.earned)) };
    }
  }
  const coins = clampWalletCoins(data?.coins);
  const earned = Math.max(coins, clampWalletCoins(data?.earned));
  return { coins, earned };
});

export async function getGameCoins() {
  return (await getGameWallet()).coins;
}

export const listMyPurchases = cache(async () => {
  const supabase = await client();
  if (!supabase) return [] as MarketplacePurchase[];
  const { data, error } = await supabase
    .from("marketplace_purchases")
    .select("listing_id, buyer_id, status, amount_paise, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const purchase = asPurchase(row);
    return purchase ? [purchase] : [];
  });
});

export async function listPendingMoneyPurchases() {
  const purchases = await listMyPurchases();
  return purchases.filter((item) => item.status === "checkout_soon" && item.buyer_id);
}

export const listMyPurchaseItems = cache(async () => {
  const [purchases, listings] = await Promise.all([listMyPurchases(), listMarketplaceListings()]);
  return attachListingsToPurchases(purchases, listings);
});

export const listMarketplaceReviewRatings = cache(async (): Promise<ReviewRatingSummary[]> => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_reviews")
    .select("listing_id, rating")
    .limit(4000);
  if (error) {
    console.error("listMarketplaceReviewRatings", error);
    return [];
  }
  return summarizeReviews(
    (data ?? []).flatMap((row) => {
      const listing_id = typeof row.listing_id === "string" ? row.listing_id : "";
      const rating = typeof row.rating === "number" ? row.rating : 0;
      return listing_id ? [{ listing_id, rating }] : [];
    }),
  );
});

export const listMarketplaceReviews = cache(async (listingId: string) => {
  const supabase = await client();
  if (!supabase) return [] as MarketplaceReview[];
  const { data, error } = await supabase
    .from("marketplace_reviews")
    .select("id, listing_id, reviewer_id, rating, body, author_label, created_at, updated_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listMarketplaceReviews", error);
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const review = asReview(row);
    return review ? [review] : [];
  });
});

export const listPrompts = cache(async () => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("thumbnail_prompts")
    .select("id, content_id, topic, language, landscape_prompt, vertical_prompt, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Could not load saved prompts.");
  return (data ?? []).map(asPrompt);
});

// ---------------------------------------------------------------------------
// Creator tools. Each returns `missing: true` when the creator-tools SQL has not been run yet,
// so pages can say what to do instead of failing.
// ---------------------------------------------------------------------------

function missingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return error.code === "42P01" || error.code === "42703" || error.code === "PGRST204" || error.code === "PGRST205" || message.includes("does not exist") || message.includes("could not find");
}

export const getCreatorSettings = cache(async (): Promise<{ settings: CreatorSettings | null; missing: boolean }> => {
  const supabase = await client();
  if (!supabase) return { settings: null, missing: false };
  const { data, error } = await supabase
    .from("profiles")
    .select("weekly_goal, onboarding_dismissed_at, calendar_token, public_handle, page_public, page")
    .maybeSingle();
  if (error) {
    if (!missingTable(error)) console.error("getCreatorSettings", error);
    return { settings: null, missing: missingTable(error) };
  }
  return { settings: data ? asCreatorSettings(data) : null, missing: false };
});

export const publishedHistory = cache(async (): Promise<string[]> => {
  const supabase = await client();
  if (!supabase) return [];
  const since = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("contents")
    .select("published_at")
    .eq("status", "published")
    .eq("is_template", false)
    .gte("published_at", since)
    .limit(2000);
  if (error) {
    if (!missingTable(error)) console.error("publishedHistory", error);
    return [];
  }
  return (data ?? []).flatMap((row) => (typeof row.published_at === "string" ? [row.published_at] : []));
});

export async function listBrandDeals(): Promise<{ deals: BrandDeal[]; missing: boolean }> {
  const supabase = await client();
  if (!supabase) return { deals: [], missing: false };
  const { data, error } = await supabase
    .from("brand_deals")
    .select("id, brand, status, amount_paise, due_date, deliverables, contact, notes, updated_at")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(500);
  if (error) {
    if (!missingTable(error)) console.error("listBrandDeals", error);
    return { deals: [], missing: missingTable(error) };
  }
  return { deals: (data ?? []).flatMap((row) => asBrandDeal(row) ?? []), missing: false };
}

export async function listCreatorLinks(): Promise<{ links: CreatorLink[]; missing: boolean }> {
  const supabase = await client();
  if (!supabase) return { links: [], missing: false };
  const { data, error } = await supabase
    .from("creator_links")
    .select("id, title, url, position, clicks")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) {
    if (!missingTable(error)) console.error("listCreatorLinks", error);
    return { links: [], missing: missingTable(error) };
  }
  return {
    links: (data ?? []).flatMap((row) =>
      typeof row.id === "string" && typeof row.title === "string" && typeof row.url === "string"
        ? [{ id: row.id, title: row.title, url: row.url, position: Number(row.position) || 0, clicks: Number(row.clicks) || 0 }]
        : [],
    ),
    missing: false,
  };
}

/** Anyone may view a creator page that its owner made public. */
export async function getPublicCreatorPage(handle: string): Promise<PublicCreatorPage | null> {
  if (!isSupabaseConfigured() || !isValidHandle(normalizeHandle(handle))) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creator_page", { p_handle: normalizeHandle(handle) });
  if (error) {
    if (!missingTable(error)) console.error("getPublicCreatorPage", error);
    return null;
  }
  return asPublicPage(data);
}

export type SharedContent = {
  title: string;
  topic: string | null;
  platform: string;
  language: string;
  status: Status;
  planned_date: string | null;
  description: string | null;
  youtube_description: string | null;
  instagram_caption: string | null;
  tags: string[];
  hashtags: string[];
  script_notes: string | null;
  updated_at: string;
  author: string | null;
};

export async function getSharedContent(token: string): Promise<SharedContent | null> {
  if (!isSupabaseConfigured() || !/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("shared_content", { p_token: token });
  if (error || !data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const textOrNull = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);
  const list = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  if (typeof row.title !== "string") return null;
  return {
    title: row.title,
    topic: textOrNull(row.topic),
    platform: String(row.platform ?? "both"),
    language: String(row.language ?? "en"),
    status: (statuses as readonly string[]).includes(String(row.status)) ? (row.status as Status) : "idea",
    planned_date: textOrNull(row.planned_date),
    description: textOrNull(row.description),
    youtube_description: textOrNull(row.youtube_description),
    instagram_caption: textOrNull(row.instagram_caption),
    tags: list(row.tags),
    hashtags: list(row.hashtags),
    script_notes: textOrNull(row.script_notes),
    updated_at: String(row.updated_at ?? ""),
    author: textOrNull(row.author),
  };
}

export const getChannelProfile = cache(async (): Promise<{ channel: ChannelProfile | null; missing: boolean }> => {
  const supabase = await client();
  if (!supabase) return { channel: null, missing: false };
  const { data, error } = await supabase.from("profiles").select("channel").maybeSingle();
  if (error) {
    if (!missingTable(error)) console.error("getChannelProfile", error);
    return { channel: null, missing: missingTable(error) };
  }
  return { channel: asChannel(data?.channel), missing: false };
});
