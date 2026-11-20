import type { IdeaTheme, Language, PlanHorizon, Platform, Status } from "@/lib/types";

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
  "#0d8a7f",
  "#e25d3a",
  "#1d4ed8",
  "#be123c",
  "#6d28d9",
  "#3f6212",
];

export const statusColors: Record<Status, string> = {
  idea: "#c2410c",
  planning: "#b45309",
  in_progress: "#1d4ed8",
  ready: "#0d8a7f",
  scheduled: "#6d28d9",
  published: "#15803d",
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

export const planHorizonLabels: Record<PlanHorizon, string> = {
  week: "One week",
  month: "One month",
};

export const draftStatuses: Status[] = ["idea", "planning", "in_progress"];
