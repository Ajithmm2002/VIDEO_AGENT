"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Clapperboard,
  Gamepad2,
  Hash,
  ImageIcon,
  LayoutDashboard,
  Library,
  Lightbulb,
  Loader2,
  Menu,
  BadgePercent,
  PenLine,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Shield,
  X,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui";
import { useGenerationJobs } from "@/lib/background-generate";
import { headerContext, usesContentSearch } from "@/lib/app-shell-nav";
import { formatCoinBalance, formatCoins } from "@/lib/game-coins";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Plan",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/content", label: "Content", icon: Clapperboard },
      { href: "/planner", label: "Planner", icon: Lightbulb },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/library", label: "Library", icon: Library },
    ],
  },
  {
    label: "Create",
    links: [
      { href: "/thumbnails", label: "Thumbnails", icon: ImageIcon },
      { href: "/assistant", label: "Writing", icon: PenLine },
      { href: "/hashtags", label: "Hashtags", icon: Hash },
      { href: "/affiliate", label: "Affiliate ads", icon: BadgePercent },
    ],
  },
  {
    label: "Discover",
    links: [
      { href: "/marketplace", label: "Marketplace", icon: Store },
      { href: "/play", label: "Fun mode", icon: Gamepad2 },
    ],
  },
];

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  email,
  configured,
  isAdmin,
  coins = 0,
  earned = 0,
  children,
}: {
  email: string | null;
  configured: boolean;
  isAdmin?: boolean;
  coins?: number;
  earned?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const jobs = useGenerationJobs();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeJobs = Object.values(jobs).filter((job) => job.pending);

  const nav = (
    <nav className="grid gap-5 pb-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{group.label}</p>
          <div className="grid gap-1">
            {group.links.map((link) => {
              const active = navActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
                    active ? "nav-item-active" : "font-medium text-muted hover:text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={cn("grid h-8 w-8 place-items-center rounded-md", active ? "ig-gradient text-white" : "bg-surface-2")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {isAdmin ? (
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Admin</p>
          <Link
            href="/admin/marketplace"
            prefetch
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
              navActive(pathname, "/admin/marketplace")
                ? "nav-item-active"
                : "font-medium text-muted hover:text-ink",
            )}
            aria-current={navActive(pathname, "/admin/marketplace") ? "page" : undefined}
          >
            <span className={cn("grid h-8 w-8 place-items-center rounded-md", navActive(pathname, "/admin/marketplace") ? "ig-gradient text-white" : "bg-surface-2")}>
              <Shield className="h-4 w-4" />
            </span>
            Sell
          </Link>
        </div>
      ) : null}
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Account</p>
        <div className="grid gap-1">
        <Link
          href="/purchases"
          prefetch
          onClick={() => setOpen(false)}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
            pathname.startsWith("/purchases")
              ? "nav-item-active"
              : "font-medium text-muted hover:text-ink",
          )}
          aria-current={pathname.startsWith("/purchases") ? "page" : undefined}
        >
          <span className={cn("grid h-8 w-8 place-items-center rounded-md", pathname.startsWith("/purchases") ? "ig-gradient text-white" : "bg-surface-2")}>
            <ShoppingBag className="h-4 w-4" />
          </span>
          Purchases
        </Link>
        <Link
          href="/settings"
          prefetch
          onClick={() => setOpen(false)}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm",
            pathname.startsWith("/settings")
              ? "nav-item-active"
              : "font-medium text-muted hover:text-ink",
          )}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
        >
          <span className={cn("grid h-8 w-8 place-items-center rounded-md", pathname.startsWith("/settings") ? "ig-gradient text-white" : "bg-surface-2")}>
            <Settings className="h-4 w-4" />
          </span>
          Settings
        </Link>
        </div>
      </div>
    </nav>
  );

  const accountCard = (
    <div className="rounded-md border border-line bg-surface-2 px-3 py-3">
      <p className="truncate text-xs font-medium">{email ?? (configured ? "Workspace" : "Local draft mode")}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted">
        {email
          ? `${formatCoinBalance(earned)} earned · ${formatCoins(coins)} in-app only`
          : "Connect Supabase to save your work."}
      </p>
    </div>
  );

  const mobileTabs = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/content", label: "Content", icon: Clapperboard },
    { href: "/marketplace", label: "Shop", icon: Store },
    { href: "/play", label: "Play", icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-hidden border-r border-line bg-bg p-4 lg:flex">
        <div className="mb-6 shrink-0">
          <BrandMark />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {nav}
        </div>
        <div className="mt-3 shrink-0">
          {accountCard}
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-[min(20rem,88vw)] flex-col overflow-hidden bg-bg p-4">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <BrandMark />
              <Button variant="ghost" className="min-h-11 min-w-11" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              {nav}
            </div>
            <div className="mt-3 shrink-0 pb-[env(safe-area-inset-bottom)]">
              {accountCard}
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          {usesContentSearch(pathname) ? (
            <form
              className="relative flex min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                const value = query.trim();
                router.push(value ? `/content?q=${encodeURIComponent(value)}` : "/content");
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles and topics"
                aria-label="Search content"
                className="h-11 w-full rounded-md border border-line bg-surface pl-10 pr-3 text-sm"
              />
            </form>
          ) : (
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{headerContext(pathname)}</p>
          )}
          {activeJobs.length ? (
            <>
              <Link
                href={activeJobs[0].href}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 text-accent sm:hidden"
                aria-label={activeJobs[0].label}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Link>
              <div className="hidden items-center gap-2 sm:flex">
                {activeJobs.map((job) => (
                  <Link
                    key={job.href}
                    href={job.href}
                    className="inline-flex items-center gap-2 rounded-full bg-accent/12 px-3 py-1.5 text-xs font-semibold text-accent"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {job.label}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
          <ThemeToggle />
          {email ? (
            <form action={signOut}>
              <SubmitButton variant="secondary" pendingLabel="Signing out…">Sign out</SubmitButton>
            </form>
          ) : (
            <Link href="/login" className="ig-gradient inline-flex h-11 items-center rounded-md px-3.5 text-sm font-semibold text-white">
              Sign in
            </Link>
          )}
        </header>
        <main className="px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {configured ? null : (
            <div className="mb-6 overflow-hidden rounded-md border border-line bg-surface p-4 sm:p-5">
              <p className="text-sm font-semibold">This device is in local draft mode</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Thumbnail prompts and writing drafts still work. <Link href="/login" className="font-medium text-ink underline decoration-accent/50 underline-offset-2">Sign in</Link> and <Link href="/register" className="font-medium text-ink underline decoration-accent/50 underline-offset-2">create an account</Link> after you add the project URL and anon key in <span className="font-medium text-ink">.env.local</span>.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Primary"
      >
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = navActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              className={cn(
                "grid min-h-12 place-items-center gap-0.5 px-1 py-2 text-[11px] font-semibold",
                active ? "text-ink" : "text-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="grid min-h-12 place-items-center gap-0.5 px-1 py-2 text-[11px] font-semibold text-muted"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>
    </div>
  );
}
