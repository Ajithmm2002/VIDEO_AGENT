import { addDays, format, parseISO } from "date-fns";
import type { ChecklistItem, PlanHorizon } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export function uniqueLimited(values: string[], limit = 40) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

export function sanitizeSearch(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function formatDate(value: string | null) {
  if (!value) return "No date";
  const date = value.length <= 10 ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy");
}

export function checklistProgress(items: ChecklistItem[]) {
  if (!items.length) return null;
  const done = items.filter((item) => item.done).length;
  return `${done}/${items.length}`;
}

export function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\0")) {
    return "/dashboard";
  }
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "/dashboard";
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("://") ||
    decoded.includes("\0")
  ) {
    return "/dashboard";
  }
  return value;
}

export function newId() {
  return crypto.randomUUID();
}

export function defaultChecklist(): ChecklistItem[] {
  return [
    "Title and topic",
    "Script or notes",
    "Thumbnail prompt",
    "Thumbnail image",
    "Description and caption",
    "Tags and hashtags",
    "Publishing date",
  ].map((label) => ({ id: newId(), label, done: false }));
}

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function visiblePrompt(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text || text === "Not generated.") return "";
  return text;
}

export function storedPrompt(value: string) {
  return value.trim() || " ";
}

export function planItemCount(horizon: PlanHorizon) {
  return horizon === "week" ? 7 : 12;
}

export function spreadPlanDates(startDate: string, horizon: PlanHorizon, count = planItemCount(horizon)) {
  const start = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? parseISO(startDate) : new Date();
  const step = horizon === "week" ? 1 : 2;
  return Array.from({ length: count }, (_, index) => format(addDays(start, index * step), "yyyy-MM-dd"));
}

export function safeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 80) || "image";
}
