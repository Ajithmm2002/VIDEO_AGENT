import type { AffiliateProductType, IdeaTheme, Language, Platform, Status, VideoDuration } from "@/lib/types";

export const statusLabels: Record<Status, string> = {
  idea: "Idea",
  planning: "Planning",
  in_progress: "In progress",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
};

export const platformLabels: Record<Platform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  both: "YouTube and Instagram",
};

export const languageLabels: Record<Language, string> = {
  en: "English",
  ml: "Malayalam",
};

export const categoryColors = [
  "#dd2a7b",
  "#f77737",
  "#8134af",
  "#515bd4",
  "#f58529",
  "#ed4956",
];

export const statusColors: Record<Status, string> = {
  idea: "#f77737",
  planning: "#f58529",
  in_progress: "#515bd4",
  ready: "#dd2a7b",
  scheduled: "#8134af",
  published: "#22c55e",
};

export const googleFlowUrl = "https://labs.google/fx/tools/flow";

export const ideaThemeLabels: Record<IdeaTheme, string> = {
  comedy: "Comedy",
  nostalgia: "Nostalgia",
  tech: "Tech",
  education: "Education",
  food: "Food",
  lifestyle: "Lifestyle",
  family: "Family",
};

export const affiliateProductTypeLabels: Record<AffiliateProductType, string> = {
  clothing: "Clothing",
  jewellery: "Jewellery",
  shoes: "Shoes",
  electronics: "Electronics",
  beauty: "Beauty",
  home: "Home",
  other: "Other",
};

export const videoDurationLabels: Record<VideoDuration, string> = {
  15: "15 sec",
  30: "30 sec",
  45: "45 sec",
  60: "60 sec",
  90: "90 sec",
  120: "2 min",
  180: "3 min",
  300: "5 min",
};

export function planDayLabel(days: number) {
  if (days === 1) return "1 day";
  if (days === 7) return "1 week";
  return `${days} days`;
}

export const draftStatuses: Status[] = ["idea", "planning", "in_progress"];
