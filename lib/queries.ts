import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asCategory, asCollection, asContent, asListing, asPrompt, asPurchase } from "@/lib/records";
import { clampWalletCoins, WELCOME_BONUS_EMAIL, type GameWallet } from "@/lib/game-coins";
import type { Content, ContentOption, MarketplaceListing, MarketplacePurchase, Status } from "@/lib/types";
import { statuses } from "@/lib/types";
import { sanitizeSearch } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser, requestUserEmail } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

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
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const row = data as { id?: string; display_name?: string | null } | null;
  if (!row?.id) return { id: user.id, display_name: null };
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
  const email = (await requestUserEmail())?.trim().toLowerCase();
  if (email === WELCOME_BONUS_EMAIL) {
    await supabase.rpc("grant_welcome_bonus");
  }
  const { data, error } = await supabase.from("game_wallets").select("coins, earned").maybeSingle();
  if (error) {
    const { data: fallback } = await supabase.from("game_wallets").select("coins").maybeSingle();
    const coins = clampWalletCoins(fallback?.coins);
    return { coins, earned: coins };
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
