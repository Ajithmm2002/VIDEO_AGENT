/** Types and safe parsing for the public creator page (media kit + link-in-bio). */

export type CreatorRate = { label: string; price: string };

export type CreatorPageFields = {
  headline: string;
  niche: string;
  location: string;
  languages: string;
  contact_email: string;
  youtube_url: string;
  instagram_url: string;
  youtube_subscribers: string;
  instagram_followers: string;
  average_views: string;
  rates: CreatorRate[];
};

export type CreatorLink = { id: string; title: string; url: string; position: number; clicks: number };

export type CreatorSettings = {
  weekly_goal: number;
  onboarding_dismissed_at: string | null;
  calendar_token: string | null;
  public_handle: string | null;
  page_public: boolean;
  page: CreatorPageFields;
};

export type PublicCreatorPage = {
  handle: string;
  display_name: string | null;
  page: CreatorPageFields;
  links: Array<{ id: string; title: string }>;
};

export const MAX_CREATOR_LINKS = 20;
export const MAX_RATES = 6;

export function normalizeHandle(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function isValidHandle(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function emptyPage(): CreatorPageFields {
  return {
    headline: "",
    niche: "",
    location: "",
    languages: "",
    contact_email: "",
    youtube_url: "",
    instagram_url: "",
    youtube_subscribers: "",
    instagram_followers: "",
    average_views: "",
    rates: [],
  };
}

export function asPage(value: unknown): CreatorPageFields {
  const row = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const rates = Array.isArray(row.rates)
    ? row.rates
        .map((item) => {
          const rate = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return { label: text(rate.label, 60), price: text(rate.price, 40) };
        })
        .filter((rate) => rate.label)
        .slice(0, MAX_RATES)
    : [];
  return {
    headline: text(row.headline, 280),
    niche: text(row.niche, 80),
    location: text(row.location, 80),
    languages: text(row.languages, 80),
    contact_email: text(row.contact_email, 120),
    youtube_url: text(row.youtube_url, 300),
    instagram_url: text(row.instagram_url, 300),
    youtube_subscribers: text(row.youtube_subscribers, 20),
    instagram_followers: text(row.instagram_followers, 20),
    average_views: text(row.average_views, 20),
    rates,
  };
}

export function asCreatorSettings(value: unknown): CreatorSettings {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const goal = typeof row.weekly_goal === "number" ? row.weekly_goal : 3;
  return {
    weekly_goal: Math.min(21, Math.max(1, Math.round(goal))),
    onboarding_dismissed_at: typeof row.onboarding_dismissed_at === "string" ? row.onboarding_dismissed_at : null,
    calendar_token: typeof row.calendar_token === "string" ? row.calendar_token : null,
    public_handle: typeof row.public_handle === "string" ? row.public_handle : null,
    page_public: row.page_public === true,
    page: asPage(row.page),
  };
}

export function asPublicPage(value: unknown): PublicCreatorPage | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.handle !== "string") return null;
  const links = Array.isArray(row.links)
    ? row.links.flatMap((item) => {
        const link = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return typeof link.id === "string" && typeof link.title === "string" ? [{ id: link.id, title: link.title }] : [];
      })
    : [];
  return {
    handle: row.handle,
    display_name: typeof row.display_name === "string" ? row.display_name : null,
    page: asPage(row.page),
    links,
  };
}
