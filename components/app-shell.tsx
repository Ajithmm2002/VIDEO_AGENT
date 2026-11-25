"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, ViewTransition } from "react";
import {
  BadgePercent,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  Coins,
  Gamepad2,
  Hash,
  ImageIcon,
  LayoutDashboard,
  Library,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { useGenerationJobs } from "@/lib/background-generate";
import { headerContext, usesContentSearch } from "@/lib/app-shell-nav";
import { formatCoins } from "@/lib/game-coins";
import { cn } from "@/lib/utils";

const PAGE_NAV = ["page-nav"];

type NavLink = { href: string; label: string; icon: LucideIcon };

const groups: Array<{ label: string; links: NavLink[] }> = [
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
      { href: "/assistant", label: "Writing", icon: PenLine },
      { href: "/thumbnails", label: "Thumbnails", icon: ImageIcon },
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

const accountLinks: NavLink[] = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLink: NavLink = { href: "/admin/marketplace", label: "Manage products", icon: Shield };

const mobileTabs: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: Clapperboard },
  { href: "/marketplace", label: "Shop", icon: Store },
  { href: "/play", label: "Play", icon: Gamepad2 },
];

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.trim().slice(0, 2);
  return letters.toUpperCase() || "CS";
}

function NavItem({ link, active, onNavigate }: { link: NavLink; active: boolean; onNavigate: () => void }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      transitionTypes={PAGE_NAV}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm",
        active ? "nav-item-active" : "font-medium text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

export function AppShell({
  email,
  displayName,
  configured,
  isAdmin,
  coins = 0,
  earned = 0,
  children,
}: {
  email: string | null;
  displayName?: string | null;
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
  const [userMenu, setUserMenu] = useState(false);
  const [query, setQuery] = useState("");
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const activeJobs = Object.values(jobs).filter((job) => job.pending);
  const showSearch = usesContentSearch(pathname);

  useEffect(() => {
    if (!open) return;
    closeMenuRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!userMenu) return;
    function onPointer(event: PointerEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenu(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenu(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [userMenu]);

  // Press "/" anywhere outside a text field to jump to search.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!searchRef.current) return;
      event.preventDefault();
      searchRef.current.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeDrawer = () => setOpen(false);
  const visibleName = displayName?.trim() || (email ? email.split("@")[0] : null) || (configured ? "Workspace" : "Local draft mode");

  const nav = (
    <nav className="grid gap-6 pb-4" aria-label="Studio">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{group.label}</p>
          <div className="grid gap-0.5">
            {group.links.map((link) => (
              <NavItem key={link.href} link={link} active={navActive(pathname, link.href)} onNavigate={closeDrawer} />
            ))}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
        <div className="grid gap-0.5">
          {(isAdmin ? [...accountLinks, adminLink] : accountLinks).map((link) => (
            <NavItem key={link.href} link={link} active={navActive(pathname, link.href)} onNavigate={closeDrawer} />
          ))}
        </div>
      </div>
    </nav>
  );

  const accountCard = (
    <Link
      href={email ? "/profile" : "/login"}
      onClick={closeDrawer}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 hover:bg-surface-2"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent" aria-hidden>
        {initials(visibleName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{visibleName}</span>
        <span className="block truncate text-xs text-muted">
          {email ? `${formatCoins(coins)} · ${formatCoins(earned)} earned` : "Connect Supabase to save"}
        </span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-4">
          <BrandMark />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-5">{nav}</div>
        <div className="shrink-0 border-t border-line p-3">{accountCard}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Studio menu">
          <button className="animate-veil-in absolute inset-0 bg-scrim" aria-label="Close menu" onClick={closeDrawer} />
          <div className="drawer-in relative flex h-full w-[min(20rem,86vw)] flex-col overflow-hidden border-r border-line bg-surface shadow-[var(--shadow-lg)]">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <BrandMark />
              <Button ref={closeMenuRef} variant="ghost" className="min-h-10 min-w-10 px-0" aria-label="Close menu" onClick={closeDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-5">{nav}</div>
            <div className="shrink-0 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{accountCard}</div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 max-w-full lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 min-w-0 items-center gap-2 border-b border-line bg-bg/95 px-3 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          {showSearch ? (
            <form
              role="search"
              className="relative flex min-w-0 max-w-xl flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                const value = query.trim();
                router.push(value ? `/content?q=${encodeURIComponent(value)}` : "/content");
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search content"
                aria-label="Search content"
                className="h-10 w-full min-w-0 rounded-xl border border-line bg-surface pl-9 pr-10 text-base md:text-sm"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface-2 px-1.5 text-[11px] font-medium text-muted sm:block">
                /
              </kbd>
            </form>
          ) : (
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{headerContext(pathname)}</p>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {activeJobs.length ? (
              <Link
                href={activeJobs[0].href}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent-soft px-3 text-xs font-semibold text-accent"
                aria-label={activeJobs[0].label}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                <span className="hidden sm:inline">
                  {activeJobs[0].label}
                  {activeJobs.length > 1 ? ` +${activeJobs.length - 1}` : ""}
                </span>
              </Link>
            ) : null}
            {email ? (
              <Link
                href="/play"
                className="hidden h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-semibold sm:inline-flex"
                title="Studio coins (in-app only)"
              >
                <Coins className="h-3.5 w-3.5 text-warn" aria-hidden />
                {coins.toLocaleString("en-IN")}
              </Link>
            ) : null}
            <ThemeToggle />
            {email ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface pl-1 pr-2 hover:bg-surface-2"
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  aria-label={`Account menu for ${visibleName}`}
                  onClick={() => setUserMenu((value) => !value)}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent" aria-hidden>
                    {initials(visibleName)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
                </button>
                {userMenu ? (
                  <div
                    role="menu"
                    className="animate-pop-in absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-lg)]"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold">{visibleName}</p>
                      <p className="truncate text-xs text-muted">{email}</p>
                    </div>
                    <div className="grid p-1.5">
                      {accountLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            role="menuitem"
                            href={link.href}
                            onClick={() => setUserMenu(false)}
                            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-surface-2"
                          >
                            <Icon className="h-4 w-4 text-muted" aria-hidden />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                    <form action={signOut} className="border-t border-line p-1.5">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-danger hover:bg-surface-2"
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        Sign out
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/login" className="bg-accent inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-accent-ink">
                Sign in
              </Link>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {configured ? null : (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3">
              <p className="text-sm leading-6">
                <span className="font-semibold">Local draft mode.</span>{" "}
                <span className="text-muted">Generators work, but nothing is saved until Supabase keys are added to .env.local.</span>
              </p>
              <Link href="/register" className="text-sm font-semibold text-accent hover:underline">
                Create an account
              </Link>
            </div>
          )}
          <ViewTransition update={{ "page-nav": "page", default: "none" }} enter={{ "page-nav": "page", default: "none" }} exit="none" default="none">
            <div>{children}</div>
          </ViewTransition>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
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
              transitionTypes={PAGE_NAV}
              className={cn(
                "relative grid min-h-14 place-items-center gap-0.5 px-1 py-2 text-[11px] font-semibold",
                active ? "text-accent" : "text-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" aria-hidden /> : null}
              <Icon className="h-5 w-5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="grid min-h-14 place-items-center gap-0.5 px-1 py-2 text-[11px] font-semibold text-muted"
          aria-label="Open menu"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden />
          Menu
        </button>
      </nav>
    </div>
  );
}
