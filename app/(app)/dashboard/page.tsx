import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, Camera, ImageIcon, Lightbulb, PartyPopper, PenLine, Play, Plus } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { OnboardingChecklist, type OnboardingStep } from "@/components/onboarding-checklist";
import { Card, EmptyState, PageHeader, buttonClass } from "@/components/ui";
import { WeeklyGoalCard } from "@/components/weekly-goal";
import { accountLabel } from "@/lib/account-label";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_WEEKLY_GOAL, weeklyProgress } from "@/lib/goals";
import { dashboardData, getCreatorSettings, getProfile, publishedHistory } from "@/lib/queries";
import { requestUserEmail } from "@/lib/session";
import { checklistProgress, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const pipeline = [
  { label: "Drafts", key: "drafts", hint: "Idea to in progress", color: "var(--muted)" },
  { label: "Ready", key: "ready", hint: "Waiting for a date", color: "var(--info)" },
  { label: "Scheduled", key: "scheduled", hint: "Date is set", color: "var(--accent)" },
  { label: "Published", key: "published", hint: "Live", color: "var(--ok)" },
] as const;

const quickActions = [
  { href: "/assistant", label: "Write captions", body: "Titles, tags, hashtags, and a hook.", icon: PenLine },
  { href: "/thumbnails", label: "Thumbnail prompt", body: "16:9 and 9:16 prompts for Google Flow.", icon: ImageIcon },
  { href: "/festivals", label: "Festival ideas", body: "Ready-made ideas for upcoming festivals.", icon: PartyPopper },
  { href: "/affiliate", label: "Affiliate ad", body: "Caption and prompts from a product link.", icon: BadgePercent },
];

function greeting(name: string) {
  return name === "Workspace" || name === "Local draft mode" ? "Your studio at a glance" : `Welcome back, ${name}`;
}

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  const [data, profile, email, creator, published] = await Promise.all([
    dashboardData(),
    configured ? getProfile() : Promise.resolve(null),
    configured ? requestUserEmail() : Promise.resolve(null),
    getCreatorSettings(),
    publishedHistory(),
  ]);
  const name = accountLabel(profile?.display_name, email);
  const settings = creator.settings;
  const progress = weeklyProgress(published, settings?.weekly_goal ?? DEFAULT_WEEKLY_GOAL);
  const steps: OnboardingStep[] = [
    { id: "idea", label: "Create your first idea", hint: "Start with just a title.", href: "/content/new", done: data.total > 0 },
    {
      id: "date",
      label: "Give it a publishing date",
      hint: "Pick a date on the item or drag it on the calendar.",
      href: "/calendar",
      done: data.upcoming.length > 0 || data.scheduled > 0 || data.published > 0,
    },
    { id: "ready", label: "Get one item ready", hint: "Fill the caption and tags, then mark it Ready.", href: "/content", done: data.ready + data.scheduled + data.published > 0 },
    { id: "publish", label: "Publish your first video", hint: "Mark it Published to start your streak.", href: "/content", done: data.published > 0 },
    { id: "calendar", label: "Sync your calendar", hint: "See dates in Google or Apple Calendar.", href: "/settings", done: Boolean(settings?.calendar_token) },
    { id: "page", label: "Set up your creator page", hint: "One link for your bio and brand deals.", href: "/creator-page", done: Boolean(settings?.public_handle) },
  ];
  const showOnboarding = Boolean(settings) && !settings?.onboarding_dismissed_at && steps.some((step) => !step.done);
  const pipelineTotal = pipeline.reduce((sum, stage) => sum + data[stage.key], 0);
  const platformMax = Math.max(data.youtube, data.instagram, 1);

  return (
    <div>
      <PageHeader
        title={greeting(name)}
        description="What you are planning, drafting, and publishing, in one place."
        action={
          <>
            <Link href="/planner" className={buttonClass("secondary")}>
              <Lightbulb className="h-4 w-4" aria-hidden />
              Plan ideas
            </Link>
            <Link href="/content/new" className={buttonClass("primary")}>
              <Plus className="h-4 w-4" aria-hidden />
              New content
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Pipeline</h2>
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{data.total}</span> item{data.total === 1 ? "" : "s"} in total
            </p>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface-2" role="img" aria-label="Share of items in each stage">
            {pipelineTotal
              ? pipeline.map((stage) =>
                  data[stage.key] ? (
                    <span key={stage.key} style={{ width: `${(data[stage.key] / pipelineTotal) * 100}%`, background: stage.color }} />
                  ) : null,
                )
              : null}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pipeline.map((stage) => (
              <div key={stage.key} className="min-w-0">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: stage.color }} aria-hidden />
                  {stage.label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{data[stage.key]}</dd>
                <dd className="text-xs text-muted">{stage.hint}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            {[
              { label: "YouTube", value: data.youtube, color: "var(--youtube)", icon: Play },
              { label: "Instagram", value: data.instagram, color: "var(--instagram)", icon: Camera },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="min-w-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: row.color }} aria-hidden />
                      {row.label}
                    </span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${(row.value / platformMax) * 100}%`, background: row.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <WeeklyGoalCard progress={progress} editable={Boolean(settings)} />
      </div>

      {showOnboarding ? <OnboardingChecklist steps={steps} /> : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] hover:border-accent/40 hover:bg-surface-2"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </span>
                <span className="mt-0.5 block text-[13px] leading-5 text-muted">{action.body}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Recently updated</h2>
            <Link href="/content" className="text-sm font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3">
            {data.recent.length ? (
              <ul className="divide-y divide-line">
                {data.recent.map((item) => (
                  <li key={item.id}>
                    <Link href={`/content/${item.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted">
                          Updated {formatDate(item.updated_at)}
                          {checklistProgress(item.checklist) ? ` · ${checklistProgress(item.checklist)} done` : ""}
                        </span>
                      </span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No content yet"
                body="Create your first idea, or plan a whole week in one go."
                action={
                  <Link href="/content/new" className={buttonClass("primary")}>
                    <Plus className="h-4 w-4" aria-hidden />
                    New content
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Upcoming</h2>
            <Link href="/calendar" className="text-sm font-semibold text-accent hover:underline">
              Calendar
            </Link>
          </div>
          {data.upcoming.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.upcoming.map((item) => {
                const date = item.planned_date ? new Date(`${item.planned_date}T00:00:00`) : null;
                return (
                  <li key={item.id}>
                    <Link href={`/content/${item.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                      <span
                        className="grid w-11 shrink-0 rounded-lg border border-line bg-surface-2 py-1 text-center leading-none"
                        aria-hidden
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                          {date ? date.toLocaleDateString("en-IN", { month: "short" }) : "—"}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums">{date ? date.getDate() : ""}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted">{formatDate(item.planned_date)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Nothing scheduled. Set a planned date on a content item, or drag it onto the{" "}
              <Link href="/calendar" className="font-medium text-accent hover:underline">
                calendar
              </Link>
              .
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
