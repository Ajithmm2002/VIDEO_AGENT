"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Clapperboard,
  Hash,
  ImageIcon,
  LayoutDashboard,
  Library,
  Lightbulb,
  Loader2,
  Menu,
  PenLine,
  Search,
  Settings,
  X,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, SubmitButton } from "@/components/ui";
import { useGenerationJobs } from "@/lib/background-generate";
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
    ],
  },
];

export function AppShell({
  email,
  configured,
  children,
}: {
  email: string | null;
  configured: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const jobs = useGenerationJobs();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeJobs = Object.values(jobs).filter((job) => job.pending);

  const nav = (
    <nav className="grid gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{group.label}</p>
          <div className="grid gap-1">
            {group.links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-accent/12 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
                      : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <span className={cn("grid h-8 w-8 place-items-center rounded-xl", active ? "bg-accent text-accent-ink" : "bg-surface-2")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Account</p>
        <Link
          href="/settings"
          prefetch
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
            pathname.startsWith("/settings")
              ? "bg-accent/12 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
              : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          <span className={cn("grid h-8 w-8 place-items-center rounded-xl", pathname.startsWith("/settings") ? "bg-accent text-accent-ink" : "bg-surface-2")}>
            <Settings className="h-4 w-4" />
          </span>
          Settings
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line/80 bg-surface/70 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-8">
          <BrandMark />
        </div>
        {nav}
        <div className="mt-auto rounded-2xl border border-line bg-surface-2/70 px-3 py-3">
          <p className="truncate text-xs font-medium">{email ?? (configured ? "Workspace" : "Local draft mode")}</p>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            {email ? "Private workspace" : "Connect Supabase to save your work."}
          </p>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/50 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-80 flex-col bg-surface p-4 shadow-[var(--shadow)]">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark />
              <Button variant="ghost" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line/70 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Button variant="secondary" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
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
              className="h-11 w-full rounded-2xl border border-line bg-surface/80 pl-10 pr-3 text-sm shadow-[var(--shadow)]"
            />
          </form>
          {activeJobs.length ? (
            <>
              <Link
                href={activeJobs[0].href}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent sm:hidden"
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
            <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-accent px-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_-12px_rgb(var(--glow)/0.9)]">
              Sign in
            </Link>
          )}
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          {configured ? null : (
            <div className="mb-6 overflow-hidden rounded-3xl border border-line bg-surface/85 p-4 shadow-[var(--shadow)] sm:p-5">
              <p className="text-sm font-semibold">This device is in local draft mode</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Thumbnail prompts and writing drafts still work. <Link href="/login" className="font-medium text-ink underline decoration-accent/50 underline-offset-2">Sign in</Link> and <Link href="/register" className="font-medium text-ink underline decoration-accent/50 underline-offset-2">create an account</Link> after you add the project URL and anon key in <span className="font-medium text-ink">.env.local</span>.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
