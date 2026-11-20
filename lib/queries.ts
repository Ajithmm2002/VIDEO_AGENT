import type { SupabaseClient } from "@supabase/supabase-js";
import { asCategory, asCollection, asContent, asPrompt } from "@/lib/records";
import type { Content, Status } from "@/lib/types";
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
  if (error) throw new Error("Could not load categories.");
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

export async function listContentOptions() {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contents")
    .select("id, title")
    .eq("is_template", false)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load content.");
  return (data ?? []).flatMap((row) => {
    const record = row as { id?: string; title?: string };
    if (!record.id || !record.title) return [];
    return [{ id: record.id, title: record.title }];
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

export async function listContents(filters: ContentFilters) {
  const supabase = await client();
  if (!supabase) return [];
  let query = supabase.from("contents").select("*");
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

type CountQuery = PromiseLike<{ count: number | null; error: unknown }> & {
  eq: (column: string, value: string) => CountQuery;
  in: (column: string, values: string[]) => CountQuery;
};

async function countContents(
  supabase: SupabaseClient,
  options?: { status?: string; platforms?: string[] },
) {
  let query = supabase
    .from("contents")
    .select("id", { count: "exact", head: true })
    .eq("is_template", false) as unknown as CountQuery;
  if (options?.status) query = query.eq("status", options.status);
  if (options?.platforms) query = query.in("platform", options.platforms);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
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

  const [total, idea, planning, progress, ready, scheduled, published, youtube, instagram, recentResult, upcomingResult] =
    await Promise.all([
      countContents(supabase),
      countContents(supabase, { status: "idea" }),
      countContents(supabase, { status: "planning" }),
      countContents(supabase, { status: "in_progress" }),
      countContents(supabase, { status: "ready" }),
      countContents(supabase, { status: "scheduled" }),
      countContents(supabase, { status: "published" }),
      countContents(supabase, { platforms: ["youtube", "both"] }),
      countContents(supabase, { platforms: ["instagram", "both"] }),
      supabase
        .from("contents")
        .select("*")
        .eq("is_template", false)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("contents")
        .select("*")
        .eq("is_template", false)
        .gte("planned_date", today)
        .neq("status", "published")
        .order("planned_date", { ascending: true })
        .limit(6),
    ]);

  if (recentResult.error || upcomingResult.error) {
    console.error("dashboardData", recentResult.error ?? upcomingResult.error);
    throw new Error("Could not load the dashboard.");
  }

  return {
    total,
    drafts: idea + planning + progress,
    ready,
    scheduled,
    published,
    youtube,
    instagram,
    recent: await attachCategories(supabase, recentResult.data ?? []),
    upcoming: await attachCategories(supabase, upcomingResult.data ?? []),
  };
}

export async function calendarContents(start: string, end: string, platform?: string, status?: string) {
  const supabase = await client();
  if (!supabase) return { dated: [] as Content[], undated: [] as Content[] };
  let dated = supabase
    .from("contents")
    .select("*")
    .eq("is_template", false)
    .gte("planned_date", start)
    .lte("planned_date", end);
  let undated = supabase
    .from("contents")
    .select("*")
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
    .select("*")
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
