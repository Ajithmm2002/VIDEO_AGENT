/** Build an iCalendar (.ics) feed of planned publishing dates as all-day events. */

export type FeedItem = { id: string; title: string; planned_date: string; status: string; platform: string; updated_at: string };

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  planning: "Planning",
  in_progress: "In progress",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
};

const PLATFORM_LABELS: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", both: "YouTube + Instagram" };

export function escapeIcalText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 bytes must be folded (RFC 5545 §3.1). */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function compactDate(date: string) {
  return date.replaceAll("-", "");
}

function nextDay(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function stamp(iso: string) {
  const date = new Date(iso);
  const safe = Number.isNaN(date.getTime()) ? new Date(0) : date;
  return safe.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildCalendar(items: FeedItem[], options: { name?: string; appUrl?: string } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Content Studio//Publishing calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcalText(options.name ?? "Content Studio")}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const item of items) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.planned_date)) continue;
    const status = STATUS_LABELS[item.status] ?? item.status;
    const platform = PLATFORM_LABELS[item.platform] ?? item.platform;
    const description = [`${platform} · ${status}`, options.appUrl ? `${options.appUrl}/content/${item.id}` : ""].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@content-studio`,
      `DTSTAMP:${stamp(item.updated_at)}`,
      `DTSTART;VALUE=DATE:${compactDate(item.planned_date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(item.planned_date))}`,
      `SUMMARY:${escapeIcalText(`${item.status === "published" ? "✅ " : ""}${item.title}`)}`,
      `DESCRIPTION:${escapeIcalText(description)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
