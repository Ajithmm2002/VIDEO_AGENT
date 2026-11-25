/**
 * Read a CSV of content ideas. Accepts the studio's own export, or a simple sheet with at
 * least a "title" column. Pure functions; the server action validates every row again.
 */

import { languages, platforms, statuses, type ContentInput, type Language, type Platform, type Status } from "@/lib/types";

export const MAX_IMPORT_ROWS = 300;

/** RFC 4180 parser: quoted fields, doubled quotes, and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** The export prefixes formula-like cells with ' so spreadsheets do not run them; undo that. */
function clean(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return /^'[=+\-@\t\r]/.test(trimmed) ? trimmed.slice(1) : trimmed;
}

const ALIASES: Record<string, string> = {
  name: "title",
  idea: "title",
  video: "title",
  date: "planned_date",
  "planned date": "planned_date",
  "publish date": "planned_date",
  caption: "instagram_caption",
  "instagram caption": "instagram_caption",
  "youtube description": "youtube_description",
  lang: "language",
};

function headerKey(value: string) {
  const key = value.trim().toLowerCase().replace(/^﻿/, "");
  return ALIASES[key] ?? key.replace(/\s+/g, "_");
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T, labels: Record<string, T> = {}) {
  const key = value.trim().toLowerCase();
  if ((allowed as readonly string[]).includes(key)) return key as T;
  return labels[key] ?? fallback;
}

function toDate(value: string) {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function list(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function number(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return value.trim() && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export type ImportPreview = { rows: ContentInput[]; skipped: number; error?: string };

export function csvToContent(text: string): ImportPreview {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], skipped: 0, error: "The file needs a header row and at least one content row." };
  const headers = table[0].map(headerKey);
  const titleIndex = headers.indexOf("title");
  if (titleIndex === -1) return { rows: [], skipped: 0, error: 'Add a "title" column to the first row.' };
  const at = (cells: string[], key: string) => {
    const index = headers.indexOf(key);
    return index === -1 ? "" : clean(cells[index]);
  };

  const rows: ContentInput[] = [];
  let skipped = 0;
  for (const cells of table.slice(1, MAX_IMPORT_ROWS + 1)) {
    const title = clean(cells[titleIndex]).slice(0, 200);
    if (!title) {
      skipped += 1;
      continue;
    }
    rows.push({
      title,
      topic: at(cells, "topic").slice(0, 500) || null,
      platform: pick<Platform>(at(cells, "platform"), platforms, "both", { "youtube and instagram": "both" }),
      language: pick<Language>(at(cells, "language"), languages, "en", { english: "en", malayalam: "ml" }),
      status: pick<Status>(at(cells, "status").replace(/\s+/g, "_"), statuses, "idea"),
      category_id: null,
      description: at(cells, "description") || null,
      youtube_description: at(cells, "youtube_description") || null,
      instagram_caption: at(cells, "instagram_caption") || null,
      tags: list(at(cells, "tags")).slice(0, 40),
      hashtags: list(at(cells, "hashtags")).slice(0, 40),
      script_notes: null,
      thumbnail_prompt: null,
      video_url: at(cells, "video_url").startsWith("https://") ? at(cells, "video_url") : null,
      published_url: at(cells, "published_url").startsWith("https://") ? at(cells, "published_url") : null,
      planned_date: toDate(at(cells, "planned_date")),
      views: number(at(cells, "views")),
      likes: number(at(cells, "likes")),
      comments: number(at(cells, "comments")),
      notes: at(cells, "notes") || null,
      reference_links: [],
      checklist: [],
      is_template: false,
    });
  }
  skipped += Math.max(0, table.length - 1 - MAX_IMPORT_ROWS);
  return { rows, skipped };
}
