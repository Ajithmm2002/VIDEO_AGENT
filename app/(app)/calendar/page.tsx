import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { CalendarBoard } from "@/components/calendar-board";
import { Card, PageHeader, SelectInput, SubmitButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { platformLabels, statusLabels } from "@/lib/labels";
import { calendarContents } from "@/lib/queries";
import { platforms, statuses } from "@/lib/types";

export const metadata: Metadata = { title: "Calendar" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = first(params.view) === "week" ? "week" : "month";
  const rawDate = first(params.date);
  const anchor = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? parseISO(rawDate) : new Date();
  const platform = first(params.platform) ?? "";
  const status = first(params.status) ?? "";
  const rangeStart = view === "week"
    ? startOfWeek(anchor, { weekStartsOn: 1 })
    : startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const rangeEnd = view === "week"
    ? endOfWeek(anchor, { weekStartsOn: 1 })
    : endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: string[] = [];
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    days.push(format(cursor, "yyyy-MM-dd"));
  }
  const previous = format(view === "week" ? addWeeks(anchor, -1) : addMonths(anchor, -1), "yyyy-MM-dd");
  const next = format(view === "week" ? addWeeks(anchor, 1) : addMonths(anchor, 1), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const data = await calendarContents(format(rangeStart, "yyyy-MM-dd"), format(rangeEnd, "yyyy-MM-dd"), platform, status);
  const query = (date: string, nextView = view) => {
    const search = new URLSearchParams();
    search.set("view", nextView);
    search.set("date", date);
    if (platform) search.set("platform", platform);
    if (status) search.set("status", status);
    return `/calendar?${search.toString()}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Drag a card to another day, or use the date field on a phone."
      />
      <Card className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="date" value={format(anchor, "yyyy-MM-dd")} />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Platform</span>
            <SelectInput name="platform" defaultValue={platform} aria-label="Platform">
              <option value="">All platforms</option>
              {platforms.map((item) => <option key={item} value={item}>{platformLabels[item]}</option>)}
            </SelectInput>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Status</span>
            <SelectInput name="status" defaultValue={status} aria-label="Status">
              <option value="">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
            </SelectInput>
          </label>
          <SubmitButton pendingLabel="Filtering…">Filter</SubmitButton>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={query(format(anchor, "yyyy-MM-dd"), "month")} className={cn("rounded-full px-3 py-1.5 text-sm", view === "month" ? "ig-gradient text-white shadow-[var(--shadow-glow)]" : "border border-line bg-surface shadow-[var(--shadow)]")}>Month</Link>
          <Link href={query(format(anchor, "yyyy-MM-dd"), "week")} className={cn("rounded-full px-3 py-1.5 text-sm", view === "week" ? "ig-gradient text-white shadow-[var(--shadow-glow)]" : "border border-line bg-surface shadow-[var(--shadow)]")}>Week</Link>
          <Link href={query(previous)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">Previous</Link>
          <Link href={query(today)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">Today</Link>
          <Link href={query(next)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">Next</Link>
        </div>
      </Card>
      <p className="mb-4 text-lg font-semibold tracking-tight">{format(anchor, view === "week" ? "'Week of' d MMM yyyy" : "MMMM yyyy")}</p>
      <CalendarBoard
        days={days}
        dated={data.dated}
        undated={data.undated}
        today={today}
        activeMonth={view === "month" ? format(anchor, "yyyy-MM") : undefined}
      />
    </div>
  );
}
