import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Camera, CheckCircle2, Clapperboard, PenLine, Play, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { CoinBalanceCard } from "@/components/coin-balance";
import { DashboardWelcome } from "@/components/dashboard-welcome";
import { Card, EmptyState } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { dashboardData, getGameWallet } from "@/lib/queries";
import { checklistProgress, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const statMeta = [
  { label: "Planned", key: "total", icon: Clapperboard, tint: "var(--accent)" },
  { label: "Drafts", key: "drafts", icon: PenLine, tint: "var(--accent-2)" },
  { label: "Ready", key: "ready", icon: Sparkles, tint: "var(--ok)" },
  { label: "Scheduled", key: "scheduled", icon: CalendarDays, tint: "var(--ig-purple)" },
  { label: "Published", key: "published", icon: CheckCircle2, tint: "var(--ok)" },
  { label: "YouTube", key: "youtube", icon: Play, tint: "#ff3040" },
  { label: "Instagram", key: "instagram", icon: Camera, tint: "var(--ig-pink)" },
] as const;

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  const [data, wallet] = await Promise.all([
    dashboardData(),
    configured ? getGameWallet() : Promise.resolve({ coins: 0, earned: 0 }),
  ]);
  const values = {
    total: data.total,
    drafts: data.drafts,
    ready: data.ready,
    scheduled: data.scheduled,
    published: data.published,
    youtube: data.youtube,
    instagram: data.instagram,
  };

  return (
    <div>
      <DashboardWelcome
        eyebrow="Workspace"
        title="Your studio at a glance"
        description="A private view of what you are planning, drafting, and publishing."
        action={
          <Link
            href="/content/new"
            className="ig-gradient relative z-10 inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-accent-ink"
          >
            New content
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <CoinBalanceCard wallet={wallet} />
        </div>
        {statMeta.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="relative overflow-hidden">
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${item.tint}, transparent)` }}
              />
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted">{item.label}</p>
                <span
                  className="grid h-9 w-9 place-items-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${item.tint} 14%, transparent)`, color: item.tint }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{configured ? values[item.key] : "—"}</p>
            </Card>
          );
        })}
      </div>
      {configured && data.total === 0 ? (
        <Card className="mt-4">
          <EmptyState
            title="Start with one idea"
            body="Write a topic, generate a thumbnail prompt, and keep the draft in this workspace. Everything you save stays on your account."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/planner"
                  className="ig-gradient inline-flex items-center rounded-2xl px-3.5 py-2 text-sm font-semibold text-accent-ink shadow-[var(--shadow-glow)]"
                >
                  Plan a week of ideas
                </Link>
                <Link
                  href="/affiliate"
                  className="inline-flex items-center rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]"
                >
                  Affiliate product ad
                </Link>
                <Link
                  href="/content/new"
                  className="inline-flex items-center rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow)]"
                >
                  Create one item
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Recently updated</h2>
            <div className="mt-4 grid gap-2">
              {data.recent.length ? data.recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-surface-2/40 px-3 py-3 hover:border-accent/40 hover:bg-surface-2"
                >
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="text-xs text-muted">{formatDate(item.updated_at)}{checklistProgress(item.checklist) ? ` · ${checklistProgress(item.checklist)} done` : ""}</span>
                  </span>
                  <StatusBadge status={item.status} />
                </Link>
              )) : (
                <EmptyState title="Nothing here yet" body="Create the first idea and it will show up here." />
              )}
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Upcoming</h2>
            <div className="mt-4 grid gap-2">
              {data.upcoming.length ? data.upcoming.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-surface-2/40 px-3 py-3 hover:border-accent/40 hover:bg-surface-2"
                >
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="text-xs text-muted">{formatDate(item.planned_date)}</span>
                  </span>
                  <StatusBadge status={item.status} />
                </Link>
              )) : (
                <EmptyState title="No dates ahead" body="Set a planned date on a content item, or use the calendar." />
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
