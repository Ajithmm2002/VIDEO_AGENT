export const platforms = ["youtube", "instagram", "both"] as const;
export const languages = ["en", "ml"] as const;
export const tagCountOptions = [5, 8, 10, 12, 15, 20, 25, 30] as const;
export const planDays = [1, 2, 3, 4, 5, 6, 7] as const;
export const videoDurations = [15, 30, 45, 60, 90, 120, 180, 300] as const;
export const ideaThemes = ["comedy", "nostalgia", "tech", "education", "food", "lifestyle", "family"] as const;
export const affiliateProductTypes = ["clothing", "jewellery", "shoes", "electronics", "beauty", "home", "other"] as const;
export const statuses = [
  "idea",
  "planning",
  "in_progress",
  "ready",
  "scheduled",
  "published",
] as const;

export type Platform = (typeof platforms)[number];
export type Language = (typeof languages)[number];
export type Status = (typeof statuses)[number];
export type PlanDays = (typeof planDays)[number];
export type VideoDuration = (typeof videoDurations)[number];
export type IdeaTheme = (typeof ideaThemes)[number];
export type AffiliateProductType = (typeof affiliateProductTypes)[number];

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ReferenceLink = {
  id: string;
  title: string;
  url: string;
};

export type Category = {
  id: string;
  name: string;
  color: string | null;
};

export type Content = {
  id: string;
  user_id: string;
  category_id: string | null;
  category: Category | null;
  title: string;
  topic: string | null;
  platform: Platform;
  language: Language;
  description: string | null;
  youtube_description: string | null;
  instagram_caption: string | null;
  tags: string[];
  hashtags: string[];
  script_notes: string | null;
  thumbnail_prompt: string | null;
  video_url: string | null;
  published_url: string | null;
  thumbnail_path: string | null;
  planned_date: string | null;
  status: Status;
  views: number | null;
  likes: number | null;
  comments: number | null;
  notes: string | null;
  reference_links: ReferenceLink[];
  checklist: ChecklistItem[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentInput = {
  title: string;
  topic: string | null;
  platform: Platform;
  language: Language;
  status: Status;
  category_id: string | null;
  description: string | null;
  youtube_description: string | null;
  instagram_caption: string | null;
  tags: string[];
  hashtags: string[];
  script_notes: string | null;
  thumbnail_prompt: string | null;
  video_url: string | null;
  published_url: string | null;
  planned_date: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  notes: string | null;
  reference_links: ReferenceLink[];
  checklist: ChecklistItem[];
  is_template: boolean;
};

export type HashtagCollection = {
  id: string;
  name: string;
  platform: Platform | null;
  hashtags: string[];
  created_at: string;
};

export type ThumbnailPromptRecord = {
  id: string;
  content_id: string | null;
  topic: string;
  language: Language;
  landscape_prompt: string;
  vertical_prompt: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
};

export type ActionResult = {
  ok: true;
  message?: string;
  id?: string;
} | {
  ok: false;
  error: string;
};

export type ContentOption = {
  id: string;
  title: string;
  language?: Language;
  topic?: string | null;
};

export type PlanIdea = {
  title: string;
  topic: string;
  description: string;
  script: string;
  durationSeconds: VideoDuration;
  planned_date: string;
};

export type ContentPlan = {
  provider: "local" | "remote";
  items: PlanIdea[];
};

export type AffiliateAd = {
  title: string;
  postDescription: string;
  instagramCaption: string;
  hashtags: string[];
  imagePrompt: string;
  videoPrompt: string;
  provider: "local" | "remote";
};

export const marketplaceKinds = ["skill", "bundle"] as const;
export type MarketplaceKind = (typeof marketplaceKinds)[number];
export type MarketplacePurchaseStatus = "checkout_soon" | "paid";

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  offerings: string[];
  kind: MarketplaceKind;
  price_paise: number;
  currency: "INR";
  listed: boolean;
  file_name: string | null;
  file_ext: "md" | "zip" | null;
  created_at: string;
};

export type MarketplacePurchase = {
  listing_id: string;
  buyer_id?: string;
  status: MarketplacePurchaseStatus;
  amount_paise: number;
  created_at: string;
};

export type MarketplaceReview = {
  id: string;
  listing_id: string;
  reviewer_id: string;
  rating: number;
  body: string;
  author_label: string;
  created_at: string;
  updated_at: string;
};

export type ProductPreview = {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  price: string | null;
};
