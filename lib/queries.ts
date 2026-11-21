import type { SupabaseClient } from "@supabase/supabase-js";
import { asCategory, asCollection, asContent, asListing, asPrompt, asPurchase } from "@/lib/records";
import type { Content, ContentOption, MarketplaceListing, MarketplacePurchase, Status } from "@/lib/types";
import { statuses } from "@/lib/types";
import { sanitizeSearch } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
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

async function client() {
  if (!isSupabaseConfigured()) return null;
  return createClient();
}

export async function listCategories() {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("categories").select("id, name, color").order("name");
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const category = asCategory(row);
    return category ? [category] : [];
  });
}

export async function listCollections() {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hashtag_collections")
    .select("id, name, platform, hashtags, created_at")
    .order("name");
  if (error) throw new Error("Could not load hashtag collections.");
  return (data ?? []).map(asCollection);
}

export async function listContentOptions(): Promise<ContentOption[]> {
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
}

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

export async function getContent(id: string) {
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
}

export async function signedThumbnailUrl(path: string | null) {
  if (!path) return null;
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.storage.from("thumbnails").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

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

export async function dashboardData() {
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

  const { data, error, count } = await supabase
    .from("contents")
    .select("id, title, status, platform, planned_date, updated_at, checklist", { count: "exact" })
    .eq("is_template", false)
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("dashboardData", error);
    throw new Error("Could not load the dashboard.");
  }

  const rows = parseContents(data ?? []);
  const upcoming = [...rows]
    .filter((item) => item.planned_date && item.planned_date >= today && item.status !== "published")
    .sort((a, b) => (a.planned_date ?? "").localeCompare(b.planned_date ?? ""))
    .slice(0, 6);

  return {
    total: count ?? rows.length,
    drafts: rows.filter((item) => item.status === "idea" || item.status === "planning" || item.status === "in_progress").length,
    ready: rows.filter((item) => item.status === "ready").length,
    scheduled: rows.filter((item) => item.status === "scheduled").length,
    published: rows.filter((item) => item.status === "published").length,
    youtube: rows.filter((item) => item.platform === "youtube" || item.platform === "both").length,
    instagram: rows.filter((item) => item.platform === "instagram" || item.platform === "both").length,
    recent: rows.slice(0, 6),
    upcoming,
  };
}

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
  return {
    dated: await attachCategories(supabase, datedResult.data ?? []),
    undated: await attachCategories(supabase, undatedResult.data ?? []),
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

export async function getProfile() {
  const supabase = await client();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userData.user.id)
    .maybeSingle();
  const row = data as { id?: string; display_name?: string | null } | null;
  if (!row?.id) return { id: userData.user.id, display_name: null };
  return { id: row.id, display_name: row.display_name ?? null };
}

export async function listMarketplaceListings(options: { includeDrafts?: boolean } = {}) {
  const supabase = await client();
  if (!supabase) return [] as MarketplaceListing[];
  let query = supabase
    .from("marketplace_listings")
    .select("id, title, description, offerings, kind, price_paise, currency, listed, file_name, file_ext, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!options.includeDrafts) query = query.eq("listed", true);
  const { data, error } = await query;
  if (error) {
    console.error("listMarketplaceListings", error);
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const listing = asListing(row);
    return listing ? [listing] : [];
  });
}

export async function getMarketplaceListing(id: string) {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, title, description, offerings, kind, price_paise, currency, listed, file_name, file_ext, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return asListing(data);
}

export async function getGameCoins() {
  const supabase = await client();
  if (!supabase) return 0;
  const { data } = await supabase.from("game_wallets").select("coins").maybeSingle();
  const coins = typeof data?.coins === "number" && Number.isFinite(data.coins) ? data.coins : 0;
  return Math.max(0, Math.min(1_000_000, Math.floor(coins)));
}

export async function listMyPurchases() {
  const supabase = await client();
  if (!supabase) return [] as MarketplacePurchase[];
  const { data, error } = await supabase
    .from("marketplace_purchases")
    .select("listing_id, status, amount_paise, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const purchase = asPurchase(row);
    return purchase ? [purchase] : [];
  });
}

export async function listPrompts() {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("thumbnail_prompts")
    .select("id, content_id, topic, language, landscape_prompt, vertical_prompt, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Could not load saved prompts.");
  return (data ?? []).map(asPrompt);
}
